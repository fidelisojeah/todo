import { TasksStatus } from '+interfaces/enums';
import { Tasks } from '+models/Tasks';
import { Users, UserDocument } from '+models/Users';
import faker from 'faker';
import { Server } from 'http';
import Mongoose from 'mongoose';

import { Application } from '../../../src/Application';

describe('Tasks Model', () => {
    let futureDate: Date;
    let application: Application;
    let user: UserDocument;
    beforeAll(async () => {
        const listenSpy = jest.spyOn(Server.prototype, 'listen').mockImplementation();

        application = new Application();
        await application.start();

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
    });

    beforeEach(async () => {
        futureDate = new Date(new Date().getTime() + 1800000);
        await new Tasks({
            title: faker.lorem.words(2),
            description: faker.lorem.text(),
            due: futureDate,
            status: TasksStatus.Pending,
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
        await application.shutdown();
        await Users.deleteMany({});
    });

    describe('Validation Failures', () => {
        test('should fail when required fields not sent', async () => {
            const task = new Tasks({});

            try {
                await task.save();
            } catch (error) {
                expect(error).toBeInstanceOf(Mongoose.Error.ValidationError);
                expect(error.toString()).toContain('Path `title` is required.');
                expect(error.toString()).toContain('Path `due` is required.');
            }
        });

        test('should fail when required fields are of wrong types', async () => {
            const task = new Tasks({
                title: faker.lorem.words(2),
                description: faker.lorem.text(),
                due: 'rubbish',
                status: 'FAKE'
            });

            try {
                await task.save();
            } catch (error) {
                expect(error).toBeInstanceOf(Mongoose.Error.ValidationError);
                expect(error.toString()).toContain('Cast to date failed');
                expect(error.toString()).toContain('Path `status` is invalid.');
            }
        });
    });
});
