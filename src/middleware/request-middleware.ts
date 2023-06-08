import {
    RequestHandler, Request, Response, NextFunction
  } from 'express';
import { RequestValidationOptions } from '../models/middleware/RequestValidationOptions';
import logger from '../logger';
import { authenticateFromHeader } from './validators/authentication';
import { authorizeFromHeader } from './validators/authorization';
import { validateRequestBody } from './validators/schema';
import UnauthenticatedError from '../errors/UnauthenticatedError';
import UnauthorizedError from '../errors/UnauthorizedError';
import BadRequestError from '../errors/BadRequestError';

export const requestMiddleware = (
    handler: RequestHandler,
    options: RequestValidationOptions
): RequestHandler => async (req: Request, res: Response, next: NextFunction) => {  
    try {
        const { headers, body } = req
        const authHeader: string = (headers["Authorization"] ?? headers["authorization"]) as string;

        const { auth: { authorizedScopes, allowApiKeyAccess }, schema: schemaOptions } = options;

        const requestIsAuthenticated = authenticateFromHeader(authHeader);
        if (!requestIsAuthenticated) {
            next(new UnauthenticatedError('Unable to authenticate request'));
            return;
        }

        const requestIsAuthorized = authorizeFromHeader(authHeader, authorizedScopes, allowApiKeyAccess);
        if (!requestIsAuthorized) {
            next(new UnauthorizedError('Unable to authorize request'));
            return;
        }

        const requestBodyIsValid = validateRequestBody(body, schemaOptions);
        if (!requestBodyIsValid) {
            next(new BadRequestError('UThe provided request body is invalid'));
            return;
        }

        await handler(req, res, null);

        next();
    } catch (err) {
        if (process.env.NODE_ENV === 'development') {
            logger.log({
                level: 'error',
                message: 'Error in request handler',
                error: err
            });
        }

        next(err);
    };
};

export default requestMiddleware;
