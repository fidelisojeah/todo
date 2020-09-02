import { NextFunction, Request, Response } from 'express';
import { getStatusText, OK } from 'http-status-codes';

/**
 * @description responseModule middleware injects a response object to the api
 * @param _
 * @param {Response} response
 * @param {NextFunction} next
 */
export function responseModule(_: Request, response: Response, next: NextFunction) {
    response.responseModule = ({ message, data, status = OK }, serializer?) => {
        const responseMessage = message || getStatusText[status];
        response.status(status);
        let transformerData = data;

        if (serializer) {
            if (Array.isArray(data)) {
                transformerData = data.map((d) => serializer.serializeOutput(d));
            } else {
                transformerData = serializer.serializeOutput(data);
            }
        }

        response.send({
            VERSION: response.locals.version || 'V1',
            statusCode: status,
            message: responseMessage,
            data: transformerData
        });
    };
    next();
}

export default responseModule;
