import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedException, GenericException } from '+core/exceptions';
import { Users } from '+models/Users';

const SECRET = process.env.SECRET || 'secret';

export const generateToken = (id: string) => {
    try {
        return jwt.sign({ id }, SECRET, { expiresIn: '12 days' });
    } catch (err) {
        if (err instanceof jwt.JsonWebTokenError) {
            throw new UnauthorizedException({ global: err.message });
        }

        throw new GenericException({
            name: 'GenericException',
            message: `Token Generation failed ${err.message || err}`
        });
    }
};

export const validateToken = (token: string): { id: string } => {
    try {
        return jwt.verify(token, SECRET) as { id: string };
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            throw new UnauthorizedException({ global: 'token expired.' });
        }

        if (err instanceof jwt.JsonWebTokenError) {
            throw new UnauthorizedException({ global: 'Unable to verify token.' });
        }

        throw new GenericException({
            name: 'GenericException',
            message: `Token Verification failed ${err.message || err}`
        });
    }
};

export const validateTokenMiddleware = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { authorization } = request.headers;
        if (!authorization) {
            throw new UnauthorizedException({
                global: 'You must send an Authorization header with `Bearer <token>`.'
            });
        }

        const [authType, token] = authorization.trim().split(' ');

        if (!authType || authType.toLowerCase() !== 'bearer') {
            throw new UnauthorizedException({ global: 'Authorization header must follow format `Bearer <token>`' });
        }

        const { id } = validateToken(token);
        const user = await Users.findById(id);
        if (!user) {
            throw new UnauthorizedException({ global: 'Authorization failed, user does not exist.' });
        }

        response.locals.userId = id;
        next();
    } catch (err) {
        next(err);
    }
};
