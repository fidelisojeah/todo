import Express from 'express';
import { Server } from 'http';
import request from 'supertest';

import { Application } from '../../src/Application';

describe('Application middleware et al tests', () => {
    let express: Express.Application | undefined;
    let application: Application;
    beforeAll(async () => {
        const listenSpy = jest.spyOn(Server.prototype, 'listen').mockImplementation();

        application = new Application();
        await application.start();

        express = application.app;
        listenSpy.mockRestore();
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    afterAll(async () => {
        jest.restoreAllMocks();
        await application.shutdown();
    });

    describe('Routes', () => {
        it('should render 404 when route is not found', async () => {
            const response = await request(express).get('/unknown').expect('Content-Type', /json/);

            expect(response.status).toBe(404);
            expect(response.body.statusCode).toBe(404);
            expect(response.body.message).toEqual('route /unknown does not exist on this server');
            expect(response.body.data).toMatchObject({ help: 'Method: GET' });
            expect(response.body.name).toEqual('RouteNotFoundException');
        });

        it('should return healthcheck', async () => {
            const response = await request(express).get('/healthcheck').expect('Content-Type', /json/);

            expect(response.status).toBe(200);

            expect(response.body.database).toMatchObject({ status: 'OK' });
            expect(response.body.healthy).toBe(true);
            expect(response.body.service.status).toEqual('OK');
        });
    });
});
