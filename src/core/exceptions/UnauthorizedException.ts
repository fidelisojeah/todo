import { UNAUTHORIZED } from 'http-status-codes';

import GenericException from './GenericException';

export default class UnauthorizedException extends GenericException {
    constructor(data: object) {
        const params = {
            name: 'UnauthorizedException',
            message: 'Error decoding token',
            data,
            statusCode: UNAUTHORIZED
        };

        super(params);
        Error.captureStackTrace(this, this.constructor);
        Object.setPrototypeOf(this, UnauthorizedException.prototype);
    }
}
