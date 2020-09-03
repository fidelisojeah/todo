import { Users } from '+models/Users';
import faker from 'faker/locale/en_CA';
import { Server } from 'http';
import Mongoose from 'mongoose';

import { Application } from '../../../src/Application';

describe('Users Model', () => {
    let application: Application;
    const email = faker.internet.email();
    beforeAll(async () => {
        const listenSpy = jest.spyOn(Server.prototype, 'listen').mockImplementation();

        application = new Application();
        await application.start();

        listenSpy.mockRestore();
    });

    beforeEach(async () => {
        await new Users({
            profile: {
                name: faker.fake('{{name.firstName}} {{name.lastName}}'),
                gender: faker.fake('{{name.gender}}'),
                timezone: faker.fake('{{address.timeZone}}')
            },
            email,
            password: faker.internet.password()
        }).save();
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

    describe('Validation Failures', () => {
        it('should fail when required fields not sent', async () => {
            const user = new Users({});

            try {
                await user.save();
            } catch (error) {
                expect(error).toBeInstanceOf(Mongoose.Error.ValidationError);
                expect(error.toString()).toContain('Path `password` is required.');
                expect(error.toString()).toContain('Path `email` is required.');
                expect(error.toString()).toContain('Path `profile.gender` is required.');
                expect(error.toString()).toContain('Path `profile.name` is required.');
                expect(error.toString()).toContain('Path `profile.timezone` is required.');
            }
        });

        it('should fail when required fields are of wrong types', async () => {
            const user = new Users({
                profile: {
                    name: faker.fake('{{name.firstName}} {{name.lastName}}'),
                    timezone: 'rubbish',
                    gender: faker.fake('{{name.gender}}')
                },
                email: 'bad-email',
                password: faker.internet.password()
            });

            try {
                await user.save();
            } catch (error) {
                expect(error).toBeInstanceOf(Mongoose.Error.ValidationError);
                expect(error.toString()).toContain('Path `email` is invalid.');
                expect(error.toString()).toContain('Path `profile.timezone` is invalid.');
            }
        });

        it('should fail when email is not unique', async () => {
            const user = new Users({
                profile: {
                    name: faker.fake('{{name.firstName}} {{name.lastName}}'),
                    timezone: faker.fake('{{address.timeZone}}'),
                    gender: faker.fake('{{name.gender}}')
                },
                email,
                password: faker.internet.password()
            });
            try {
                await user.save();
            } catch (error) {
                expect(error).toBeInstanceOf(Mongoose.Error.ValidationError);
                expect(error.toString()).toContain('Path `email` must be unique.');
            }
        });
    });
});
