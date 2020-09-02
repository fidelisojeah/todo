import { Request } from 'express';
import { NOT_FOUND } from 'http-status-codes';

import GenericException from './GenericException';

export default class EntityNotFoundException extends GenericException {
    constructor(msg: string, req?: Request) {
        const params = {
            name: 'EntityNotFoundException',
            message: `${msg}: ${req?.originalUrl}`,
            data: {
                help: `Method: ${req?.method}`
            },
            statusCode: NOT_FOUND
        };

        super(params);
        Error.captureStackTrace(this, this.constructor);
        Object.setPrototypeOf(this, EntityNotFoundException.prototype);
    }
}
