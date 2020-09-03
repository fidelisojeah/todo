import * as express from 'express';

import { Users } from '+models/Users';
import { CREATED, OK, BAD_REQUEST } from 'http-status-codes';
import { EntityNotFoundException, GenericException } from '+core/exceptions';
import { MongooseQueryParser } from 'mongoose-query-parser';
import { UsersSerializer } from '+serializer';
import isEmail from 'validator/lib/isEmail';
import { validateTokenMiddleware, generateToken } from '+utils';

interface LoginErrors {
    email?: string[];
    password?: string[];
    global?: {};
}

export class UsersController {
    public router = express.Router({ mergeParams: true });
    mongooseQueryParser: MongooseQueryParser;
    constructor() {
        require('express-async-errors');
        this.mongooseQueryParser = new MongooseQueryParser();

        this.router.post('/', this.createUser);
        this.router.post('/auth', this.loginUser);
        this.router.put('/', validateTokenMiddleware, this.updateUser);
        this.router.patch('/', validateTokenMiddleware, this.updateUser);
        this.router.delete('/', validateTokenMiddleware, this.deleteUser);
    }

    private async createUser(request: express.Request, response: express.Response) {
        const input = UsersSerializer.serializeInput(request.body, true);

        const data = await new Users(input).save();

        response.responseModule(
            {
                data: { data },
                message: 'User Created Successfully',
                status: CREATED
            },
            UsersSerializer
        );
    }

    private async loginUser(request: express.Request, response: express.Response) {
        const { email, password } = request.body;
        const errors: LoginErrors = {};
        if (!email || !isEmail(email)) {
            errors.email = ['`email` is invalid.'];
        }

        if (!password) {
            errors.password = ['`password` is invalid.'];
        }

        if (Object.keys(errors).length > 0) {
            throw new GenericException({
                name: 'LoginValidationError',
                message: 'User authentication failed.',
                data: errors,
                statusCode: BAD_REQUEST
            });
        }

        const user = await Users.findOne({ email: email.toLowerCase() });
        if (!user || !(await user.comparePassword(password))) {
            throw new GenericException({
                name: 'LoginValidationError',
                message: 'User authentication failed.',
                data: {
                    global: ['`email`/`password` is incorrect.']
                },
                statusCode: BAD_REQUEST
            });
        }

        const token = generateToken(user._id);

        response.responseModule(
            {
                data: {
                    token,
                    data: user
                },
                status: OK
            },
            UsersSerializer
        );
    }

    private async updateUser(request: express.Request, response: express.Response) {
        const user = await Users.findById(response.locals.userId);

        if (!user) {
            throw new EntityNotFoundException('User does not exist', request);
        }

        const input = UsersSerializer.serializeInput(request.body);

        const data = await Users.findByIdAndUpdate(
            user._id,
            { password: user.password, ...input },
            {
                omitUndefined: request.method === 'PATCH',
                new: true,
                runValidators: true,
                context: 'query'
            }
        );

        response.responseModule(
            {
                data: { data },
                message: 'User Updated Successfully',
                status: OK
            },
            UsersSerializer
        );
    }

    private async deleteUser(request: express.Request, response: express.Response) {
        const user = await Users.findById(response.locals.userId);

        if (!user) {
            throw new EntityNotFoundException('User does not exist', request);
        }

        await user.deleteOne();

        response.responseModule({
            data: {},
            message: 'User Deleted Successfully.',
            status: OK
        });
    }
}

export default new UsersController().router;
