import { BAD_REQUEST } from 'http-status-codes';

import GenericException from './GenericException';

export default class QueryValidationError extends GenericException {
    constructor(data: object) {
        const params = {
            name: 'QueryValidationError',
            message: `Invalid Query suplied.`,
            data,
            statusCode: BAD_REQUEST
        };

        super(params);
        Error.captureStackTrace(this, this.constructor);
        Object.setPrototypeOf(this, QueryValidationError.prototype);
    }
}
