import * as httpStatus from 'http-status-codes';

export default class GenericException extends Error {
    public name = 'GenericException';
    protected statusCode = 501;
    protected httpCode: number = httpStatus.INTERNAL_SERVER_ERROR;
    protected data?: object;

    constructor(params: { message: string; data?: object; statusCode?: number; name: string }) {
        super(params.message);

        this.name = params.name;
        this.data = params.data;
        this.statusCode = params.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
        this.httpCode = this.statusCode;
        Object.setPrototypeOf(this, GenericException.prototype);
    }

    public formatError() {
        return {
            name: this.name,
            message: this.message,
            statusCode: this.statusCode,
            ...(this.data && { data: this.data })
        };
    }
}
