import { Tasks, TasksInterfaceDocument } from '+models/Tasks';
import { TasksStatus } from '+interfaces/enums';
import { Users, UserDocument } from '+models/Users';
import { generateToken } from '+utils';
import Express from 'express';
import { Server } from 'http';
import faker from 'faker';
import request from 'supertest';
import mongoose from 'mongoose';

import { Application } from '../../../src/Application';

describe('v1/tasks', () => {
    let express: Express.Application | undefined;
    let application: Application;
    let futureDate: Date;
    let user: UserDocument;
    let secondUser: UserDocument;
    let task: TasksInterfaceDocument;
    let secondToken: string;
    let token: string;

    beforeAll(async () => {
        const listenSpy = jest.spyOn(Server.prototype, 'listen').mockImplementation();

        application = new Application();
        await application.start();

        express = application.app;
        listenSpy.mockRestore();
        user = await new Users({
            profile: {
                name: faker.fake('{{name.firstName}} {{name.lastName}}'),
                gender: faker.fake('{{name.gender}}'),
                timezone: faker.fake('{{address.timeZone}}')
            },
            email: faker.internet.email(),
            password: faker.internet.password()
        }).save();
        secondUser = await new Users({
            profile: {
                name: faker.fake('{{name.firstName}} {{name.lastName}}'),
                gender: faker.fake('{{name.gender}}'),
                timezone: faker.fake('{{address.timeZone}}')
            },
            email: faker.internet.email(),
            password: faker.internet.password()
        }).save();
        token = generateToken(user._id);
        secondToken = generateToken(secondUser._id);
    });

    beforeEach(async () => {
        futureDate = new Date(new Date().getTime() + 1800000);
        task = await new Tasks({
            title: faker.lorem.words(2),
            description: faker.lorem.text(),
            due: futureDate,
            categories: ['work', 'family'],
            userId: user._id
        }).save();
    });

    afterEach(async () => {
        await Tasks.deleteMany({});
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    afterAll(async () => {
        jest.restoreAllMocks();
        await Users.deleteMany({});
        await application.shutdown();
    });

    describe('GET /v1/tasks', () => {
        let multiTasks: TasksInterfaceDocument[];
        let secondUsersTask: TasksInterfaceDocument;
        beforeEach(async () => {
            const tasksSeed = Array.from(Array(10)).map((_, idx) =>
                new Tasks({
                    title: faker.lorem.words(2),
                    description: faker.lorem.text(),
                    due: idx !== 5 ? futureDate : new Date(new Date().getTime() + 2800000),
                    status: idx < 4 ? TasksStatus.Pending : idx < 8 ? TasksStatus.Canceled : TasksStatus.Done,
                    categories: [...(idx > 8 ? ['home', 'friends'] : idx < 3 ? [] : ['family', 'work', 'outdoors'])],
                    userId: user._id
                }).save()
            );
            await Promise.all(tasksSeed);
            multiTasks = await Promise.all(tasksSeed);

            secondUsersTask = await new Tasks({
                title: faker.lorem.words(2),
                description: faker.lorem.text(),
                due: futureDate,
                categories: ['work', 'family'],
                userId: secondUser._id
            }).save();
        });

        it('should return error when querying with invalid filter parameters', async () => {
            const response = await request(express)
                .get('/v1/tasks?badParam=stuff&sort=-badsort&title=sample')
                .set('Authorization', `Bearer ${token}`)
                .expect('Content-Type', /json/);

            expect(response.status).toBe(400);

            expect(response.body.message).toEqual(`Invalid query supplied.`);
            expect(response.body.name).toEqual('QueryValidationError');
            expect(response.body.data).toMatchObject({
                badParam: ['badParam is not a valid filter.'],
                badsort: ['badsort is not a valid sort.']
            });
        });

        it('should return all tasks that match the filter (none)', async () => {
            const response = await request(express)
                .get('/v1/tasks?title=xxxxxx')
                .set('Authorization', `Bearer ${token}`)
                .expect('Content-Type', /json/);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(0);
        });

        it('should return all tasks that match single filter', async () => {
            const response = await request(express)
                .get('/v1/tasks?status=done')
                .set('Authorization', `Bearer ${token}`)
                .expect('Content-Type', /json/);

            expect(response.status).toBe(200);
            expect(response.body.data.length).toBeGreaterThanOrEqual(2);
            expect(response.body.data[0].status).toEqual('Done');
        });

        it('should return tasks that match multiple filters', async () => {
            const response = await request(express)
                .get('/v1/tasks?status=done&categories=home,work')
                .set('Authorization', `Bearer ${token}`)
                .expect('Content-Type', /json/);

            expect(response.status).toBe(200);
            expect(response.body.data.length).toBeGreaterThanOrEqual(2);
        });

        it('should return all tasks and sort by due date', async () => {
            const response = await request(express)
                .get('/v1/tasks?sort=-due')
                .set('Authorization', `Bearer ${token}`)
                .expect('Content-Type', /json/);

            expect(response.status).toBe(200);

            expect(response.body.data.length).toBeGreaterThan(9);

            expect(response.body.data[0].id).toEqual(multiTasks[5]._id.toString());
        });

        it('should only return tasks for particular user', async () => {
            const response = await request(express)
                .get('/v1/tasks?sort=-due')
                .set('Authorization', `Bearer ${secondToken}`)
                .expect('Content-Type', /json/);

            expect(response.status).toBe(200);

            expect(response.body.data.length).toEqual(1);

            expect(response.body.data[0].id).toEqual(secondUsersTask._id.toString());
        });
    });

    describe('POST v1/tasks', () => {
        it('should fail when there are errors in data', async () => {
            const response = await request(express)
                .post('/v1/tasks')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    status: 'very bad',
                    due: 'bad too'
                })
                .expect('Content-Type', /json/);

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Tasks validation failed');
            expect(response.body.data.due).toEqual(['Cast to date failed for value "bad too" at path "due"']);
            expect(response.body.data.title).toEqual(['`title` is required.']);
            expect(response.body.data.description).toEqual(['`description` is required.']);
            expect(response.body.data.status).toEqual(['`status` is invalid.']);
        });

        it('should fail when user does not exist', async () => {
            const fakeToken = generateToken(mongoose.Types.ObjectId().toString());

            const response = await request(express)
                .post('/v1/tasks')
                .set('Authorization', `Bearer ${fakeToken}`)
                .send({
                    due: futureDate,
                    description: 'This is a sample task',
                    title: 'sample'
                })
                .expect('Content-Type', /json/);

            expect(response.status).toBe(401);
            expect(response.body.message).toContain('Error decoding token');

            expect(response.body.data.global).toEqual('Authorization failed, user does not exist.');
        });

        it('should create a new task', async () => {
            const response = await request(express)
                .post('/v1/tasks')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    due: futureDate,
                    description: 'This is a sample task',
                    title: 'sample'
                })
                .expect('Content-Type', /json/);

            expect(response.status).toBe(201);
            expect(response.body.message).toEqual('Task Created Successfully');
            expect(response.body.data.id).toBeDefined();
            expect(response.body.data.title).toEqual('sample');
            expect(response.body.data.description).toEqual('This is a sample task');
            expect(response.body.data.status).toEqual('Pending');
            expect(response.body.data.dueDescription).toEqual('in 30 minutes');
        });
    });

    describe('GET /v1/tasks/:id', () => {
        it('should return error when task does not exist', async () => {
            const fakeId = mongoose.Types.ObjectId();
            const response = await request(express)
                .get(`/v1/tasks/${fakeId}`)
                .set('Authorization', `Bearer ${token}`)
                .expect('Content-Type', /json/);

            expect(response.status).toBe(404);

            expect(response.body.message).toEqual(`Task does not exist: /v1/tasks/${fakeId}`);
            expect(response.body.data).toMatchObject({ help: 'Method: GET' });
            expect(response.body.name).toEqual('EntityNotFoundException');
        });

        it('should not retrieve task for another user', async () => {
            const response = await request(express)
                .get(`/v1/tasks/${task._id}`)
                .set('Authorization', `Bearer ${secondToken}`)
                .expect('Content-Type', /json/);

            expect(response.status).toBe(404);

            expect(response.body.message).toEqual(`Task does not exist: /v1/tasks/${task._id}`);
            expect(response.body.data).toMatchObject({ help: 'Method: GET' });
            expect(response.body.name).toEqual('EntityNotFoundException');
        });

        it('should return a task', async () => {
            const response = await request(express)
                .get(`/v1/tasks/${task._id}`)
                .set('Authorization', `Bearer ${token}`)
                .expect('Content-Type', /json/);

            expect(response.status).toBe(200);
            expect(response.body.data).toMatchObject({
                id: task._id.toString(),
                due: task.due.toISOString(),
                dueDescription: 'in 30 minutes',
                categories: ['Work', 'Family'],
                title: task.title,
                description: task.description
            });
        });
    });

    describe('DELETE /v1/tasks/:id', () => {
        it('should return error when task does not exist', async () => {
            const fakeId = mongoose.Types.ObjectId();
            const response = await request(express)
                .delete(`/v1/tasks/${fakeId}`)
                .set('Authorization', `Bearer ${token}`)
                .expect('Content-Type', /json/);

            expect(response.status).toBe(404);

            expect(response.body.message).toEqual(`Task does not exist: /v1/tasks/${fakeId}`);
            expect(response.body.data).toMatchObject({ help: 'Method: DELETE' });
            expect(response.body.name).toEqual('EntityNotFoundException');
        });

        it('should delete task when found', async () => {
            const response = await request(express)
                .delete(`/v1/tasks/${task._id}`)
                .set('Authorization', `Bearer ${token}`)
                .expect('Content-Type', /json/);

            expect(response.status).toBe(200);

            expect(response.body.message).toEqual('Task Deleted Successfully.');
        });
    });

    describe('PATCH /v1/tasks/:id', () => {
        it('should return error when task does not exist', async () => {
            const fakeId = mongoose.Types.ObjectId();
            const response = await request(express)
                .patch(`/v1/tasks/${fakeId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    status: TasksStatus.Done
                })
                .expect('Content-Type', /json/);

            expect(response.status).toBe(404);

            expect(response.body.message).toEqual(`Task does not exist: /v1/tasks/${fakeId}`);
            expect(response.body.data).toMatchObject({ help: 'Method: PATCH' });
            expect(response.body.name).toEqual('EntityNotFoundException');
        });

        it('should fail when fields are of invalid type', async () => {
            const response = await request(express)
                .patch(`/v1/tasks/${task._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    status: 'very bad'
                })
                .expect('Content-Type', /json/);

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Validation failed');
            expect(response.body.data.status).toEqual(['`status` is invalid.']);
        });

        it('should modify task status when found', async () => {
            const response = await request(express)
                .patch(`/v1/tasks/${task._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    status: TasksStatus.Done,
                    categories: ['play']
                })
                .expect('Content-Type', /json/);

            expect(response.status).toBe(200);
            expect(response.body.message).toEqual('Task Updated Successfully');
            expect(response.body.data.id).toBeDefined();
            expect(response.body.data.title).toBeDefined();
            expect(response.body.data.description).toBeDefined();
            expect(response.body.data.status).toEqual('Done');
            expect(response.body.data.categories).toEqual(['Play']);
        });
    });

    describe('PUT /v1/tasks/:id', () => {
        it('should return error when task does not exist', async () => {
            const fakeId = mongoose.Types.ObjectId();
            const response = await request(express)
                .put(`/v1/tasks/${fakeId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    status: TasksStatus.Done
                })
                .expect('Content-Type', /json/);

            expect(response.status).toBe(404);

            expect(response.body.message).toEqual(`Task does not exist: /v1/tasks/${fakeId}`);
            expect(response.body.data).toMatchObject({ help: 'Method: PUT' });
            expect(response.body.name).toEqual('EntityNotFoundException');
        });

        it('should fail when fields are of invalid type', async () => {
            const response = await request(express)
                .put(`/v1/tasks/${task._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    status: 'very bad'
                })
                .expect('Content-Type', /json/);

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Validation failed');
            expect(response.body.data.status).toEqual(['`status` is invalid.']);
        });

        it('should fail when fields are missing', async () => {
            const response = await request(express)
                .put(`/v1/tasks/${task._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    status: TasksStatus.Done
                })
                .expect('Content-Type', /json/);

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Validation failed');
            expect(response.body.data.title).toEqual(['`title` is required.']);
            expect(response.body.data.description).toEqual(['`description` is required.']);
            expect(response.body.data.due).toEqual(['`due` is required.']);
        });

        it('should modify task status when found', async () => {
            const response = await request(express)
                .patch(`/v1/tasks/${task._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    status: TasksStatus.Done,
                    title: 'A random task',
                    description: 'description of a random task',
                    due: futureDate
                })
                .expect('Content-Type', /json/);

            expect(response.status).toBe(200);
            expect(response.body.message).toEqual('Task Updated Successfully');
            expect(response.body.data.id).toBeDefined();
            expect(response.body.data.title).toBeDefined();
            expect(response.body.data.description).toBeDefined();
            expect(response.body.data.status).toEqual('Done');
        });
    });
});
