import 'express-serve-static-core';
import { Serializer } from '+interfaces/Serializer';

interface IResponse {
    message?: string;
    data?: any;
    status?: any;
}

declare module 'express-serve-static-core' {
    interface Response {
        responseModule: ({ message, data, status }: IResponse, serializer?: Serializer) => void;
    }
}
