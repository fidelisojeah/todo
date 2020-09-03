import Express from 'express';
import { Server } from 'http';
import faker from 'faker/locale/en_CA';

import request from 'supertest';
import { Application } from '../../../src/Application';
import { Users, UserDocument } from '+models/Users';
import mongoose from 'mongoose';
import { generateToken } from '+utils';

describe('v1/users', () => {
    let express: Express.Application | undefined;
    let application: Application;
    const email = faker.internet.email();
    let token: string;
    let user: UserDocument;
    beforeAll(async () => {
        const listenSpy = jest.spyOn(Server.prototype, 'listen').mockImplementation();

        application = new Application();
        await application.start();

        express = application.app;
        listenSpy.mockRestore();
    });

    beforeEach(async () => {
        user = await new Users({
            profile: {
                name: faker.fake('{{name.firstName}} {{name.lastName}}'),
                gender: faker.fake('{{name.gender}}'),
                timezone: faker.fake('{{address.timeZone}}')
            },
            email,
            password: faker.internet.password()
        }).save();
        token = generateToken(user._id);
    });

    afterEach(async () => {
        await Users.deleteMany({});
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    afterAll(async () => {
        jest.restoreAllMocks();
        await application.shutdown();
    });

    describe('POST v1/users/auth', () => {
        const password = faker.internet.password();
        beforeEach(async () => {
            await new Users({
                email: 'john@example.com',
                password,
                profile: {
                    name: 'John Doe',
                    gender: 'male',
                    timezone: 'America/Toronto'
                }
            }).save();
        });
        it('should throw error when input fields are invalid', async () => {
            const response = await request(express)
                .post('/v1/users/auth')
                .send({ email: 'invalid' })
                .expect('Content-Type', /json/);
            expect(response.status).toBe(400);

            expect(response.body.message).toContain('User authentication failed.');
            expect(response.body.data.email).toEqual(['`email` is invalid.']);
            expect(response.body.data.password).toEqual(['`password` is invalid.']);
        });

        it('should throw error when email is invalid', async () => {
            const response = await request(express)
                .post('/v1/users/auth')
                .send({ email: 'random@example.com', password: 'password' })
                .expect('Content-Type', /json/);
            expect(response.status).toBe(400);

            expect(response.body.message).toContain('User authentication failed.');
            expect(response.body.data.global).toEqual(['`email`/`password` is incorrect.']);
        });

        it('should throw error when password is invalid', async () => {
            const response = await request(express)
                .post('/v1/users/auth')
                .send({ email: 'john@example.com', password: 'wrong' })
                .expect('Content-Type', /json/);
            expect(response.status).toBe(400);

            expect(response.body.message).toContain('User authentication failed.');
            expect(response.body.data.global).toEqual(['`email`/`password` is incorrect.']);
        });

        it('should return token when details are correct', async () => {
            const response = await request(express)
                .post('/v1/users/auth')
                .send({ email: 'john@example.com', password })
                .expect('Content-Type', /json/);

            expect(response.status).toBe(200);
            expect(response.body.data.id).toBeDefined();
            expect(response.body.data.token).toBeDefined();
            expect(response.body.data.name).toEqual('John Doe');
            expect(response.body.data.gender).toEqual('Male');
            expect(response.body.data.timezone).toEqual('America/Toronto');
            expect(response.body.data.email).toEqual('john@example.com');
        });
    });

    describe('POST v1/users', () => {
        it('should fail when there are errors in data', async () => {
            const response = await request(express)
                .post('/v1/users')
                .send({
                    profile: {
                        timezone: 'bad'
                    }
                })
                .expect('Content-Type', /json/);

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Users validation failed');
            expect(response.body.data.email).toEqual(['`email` is required.']);
            expect(response.body.data.password).toEqual(['`password` is required.']);
            expect(response.body.data['profile.gender']).toEqual(['`profile.gender` is required.']);
            expect(response.body.data['profile.name']).toEqual(['`profile.name` is required.']);
            expect(response.body.data['profile.timezone']).toEqual(['`profile.timezone` is invalid.']);
        });

        it('should create a new user', async () => {
            const response = await request(express)
                .post('/v1/users')
                .send({
                    profile: {
                        name: 'john doe',
                        gender: 'male',
                        timezone: 'America/Toronto'
                    },
                    email: 'John.Doe@example.com',
                    password: faker.internet.password()
                })
                .expect('Content-Type', /json/);

            expect(response.status).toBe(201);
            expect(response.body.message).toEqual('User Created Successfully');
            expect(response.body.data.id).toBeDefined();
            expect(response.body.data.name).toEqual('John Doe');
            expect(response.body.data.gender).toEqual('Male');
            expect(response.body.data.timezone).toEqual('America/Toronto');
            expect(response.body.data.email).toEqual('john.doe@example.com');
        });
    });

    describe('DELETE /v1/users/id', () => {
        it('should return error when user does not exist', async () => {
            const fakeToken = generateToken(mongoose.Types.ObjectId().toString());
            const response = await request(express)
                .delete(`/v1/users`)
                .set('Authorization', `Bearer ${fakeToken}`)
                .expect('Content-Type', /json/);

            expect(response.status).toBe(401);

            expect(response.body.message).toContain('Error decoding token');
            expect(response.body.data).toMatchObject({ global: 'Authorization failed, user does not exist.' });
            expect(response.body.name).toEqual('UnauthorizedException');
        });

        it('should delete user when found', async () => {
            const response = await request(express)
                .delete(`/v1/users`)
                .set('Authorization', `Bearer ${token}`)
                .expect('Content-Type', /json/);

            expect(response.status).toBe(200);

            expect(response.body.message).toEqual('User Deleted Successfully.');
        });
    });

    describe('PATCH /v1/users/id', () => {
        it('should return error when user does not exist', async () => {
            const fakeToken = generateToken(mongoose.Types.ObjectId().toString());
            const response = await request(express)
                .patch(`/v1/users`)
                .set('Authorization', `Bearer ${fakeToken}`)
                .send({
                    profile: {
                        name: 'joan doe',
                        gender: 'female'
                    }
                })
                .expect('Content-Type', /json/);

            expect(response.status).toBe(401);

            expect(response.body.message).toContain('Error decoding token');
            expect(response.body.data).toMatchObject({ global: 'Authorization failed, user does not exist.' });
            expect(response.body.name).toEqual('UnauthorizedException');
        });

        it('should fail when fields are of invalid type', async () => {
            const response = await request(express)
                .patch(`/v1/users`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    profile: {
                        timezone: 'Bad-timezone'
                    }
                })
                .expect('Content-Type', /json/);

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Validation failed');
            expect(response.body.data['profile.timezone']).toEqual(['`profile.timezone` is invalid.']);
        });

        it('should modify user details when found', async () => {
            const response = await request(express)
                .patch(`/v1/users`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    profile: {
                        name: 'joan doe',
                        gender: 'female',
                        timezone: 'America/Toronto'
                    }
                })
                .expect('Content-Type', /json/);

            expect(response.status).toBe(200);
            expect(response.body.message).toEqual('User Updated Successfully');
            expect(response.body.data.id).toBeDefined();
            expect(response.body.data.name).toEqual('Joan Doe');
            expect(response.body.data.gender).toEqual('Female');
        });
    });

    describe('PUT /v1/users/:id', () => {
        it('should return error when user does not exist', async () => {
            const fakeToken = generateToken(mongoose.Types.ObjectId().toString());
            const response = await request(express)
                .put(`/v1/users`)
                .set('Authorization', `Bearer ${fakeToken}`)
                .send({
                    email: 'fred.doe@example.com',
                    profile: {
                        name: 'fred doe',
                        gender: 'male',
                        timezone: 'America/Toronto'
                    }
                })
                .expect('Content-Type', /json/);

            expect(response.status).toBe(401);

            expect(response.body.message).toContain('Error decoding token');
            expect(response.body.data).toMatchObject({ global: 'Authorization failed, user does not exist.' });
            expect(response.body.name).toEqual('UnauthorizedException');
        });

        it('should fail when fields are of invalid type', async () => {
            const response = await request(express)
                .put(`/v1/users`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    email: 'bad',
                    profile: {
                        name: 'fred doe',
                        gender: 'male',
                        timezone: 'bad'
                    }
                })
                .expect('Content-Type', /json/);

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Validation failed');
            expect(response.body.data.email).toEqual(['`email` is invalid.']);
            expect(response.body.data['profile.timezone']).toEqual(['`profile.timezone` is invalid.']);
        });

        it('should fail when fields are missing', async () => {
            const response = await request(express)
                .put(`/v1/users`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    email
                })
                .expect('Content-Type', /json/);

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Validation failed');
            expect(response.body.data['profile.name']).toEqual(['`profile.name` is required.']);
            expect(response.body.data['profile.timezone']).toEqual(['`profile.timezone` is required.']);
            expect(response.body.data['profile.gender']).toEqual(['`profile.gender` is required.']);
        });

        it('should modify user details when found', async () => {
            const response = await request(express)
                .patch(`/v1/users`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    email: 'fred.doe@example.com',
                    profile: {
                        name: 'fred doe',
                        gender: 'male',
                        timezone: 'America/Toronto'
                    }
                })
                .expect('Content-Type', /json/);

            expect(response.status).toBe(200);
            expect(response.body.message).toEqual('User Updated Successfully');
            expect(response.body.data.id).toBeDefined();
            expect(response.body.message).toEqual('User Updated Successfully');
            expect(response.body.data.id).toBeDefined();
            expect(response.body.data.email).toEqual('fred.doe@example.com');
            expect(response.body.data.name).toEqual('Fred Doe');
            expect(response.body.data.gender).toEqual('Male');
        });
    });
});
