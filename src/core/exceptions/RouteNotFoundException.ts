import { Request } from 'express';
import { NOT_FOUND } from 'http-status-codes';

import GenericException from './GenericException';

export default class RouteNotFoundException extends GenericException {
    constructor(req: Request) {
        const params = {
            name: 'RouteNotFoundException',
            message: `route ${req.originalUrl} does not exist on this server`,
            data: {
                help: `Method: ${req.method}`
            },
            statusCode: NOT_FOUND
        };

        super(params);
        Error.captureStackTrace(this, this.constructor);
        Object.setPrototypeOf(this, RouteNotFoundException.prototype);
    }
}
