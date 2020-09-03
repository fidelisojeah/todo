import { GenericException } from '+core/exceptions';
import { ValidationErrorResult } from '+interfaces/ValidationErrorResult';
import { NextFunction, Request, Response } from 'express';
import { BAD_REQUEST, getStatusText, INTERNAL_SERVER_ERROR } from 'http-status-codes';
import mongoose from 'mongoose';

import logger from './logger';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const errorHandler = (error: Error, _: Request, response: Response, _next: NextFunction) => {
    let errorData = {
        VERSION: response.locals.version || 'V1',
        statusCode: INTERNAL_SERVER_ERROR,
        name: 'UnhandledException',
        message: getStatusText(INTERNAL_SERVER_ERROR),
        data: {}
    };

    if (error instanceof GenericException) {
        errorData = { ...errorData, ...error.formatError() };
    }

    if (error instanceof mongoose.Error.CastError) {
        const data = {
            [error.path]: error.message
        };
        errorData = {
            ...errorData,
            name: 'CastError',
            statusCode: BAD_REQUEST,
            message: error.message,
            data
        };
    }

    if (error instanceof mongoose.Error.ValidationError) {
        const data = Object.keys(error.errors).reduce((result: ValidationErrorResult, val: string) => {
            const value = val === 'userId' ? 'global' : val;
            if (!Object.prototype.hasOwnProperty.call(result, value)) {
                result[value] = [];
            }

            result[value].push(error.errors[value].message.replace('Path ', '').trim());
            return result;
        }, {});

        errorData = {
            ...errorData,
            name: 'ValidationError',
            statusCode: BAD_REQUEST,
            message: error.message,
            data
        };
    }

    logger.error(error);

    return response.status(errorData.statusCode).send({
        ...errorData
    });
};

export default errorHandler;
