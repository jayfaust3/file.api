import {
    RequestHandler, Request, Response, NextFunction
} from 'express';
import { JwtPayload, decode } from 'jsonwebtoken';
import UnauthorizedError from '../errors/UnauthenticatedError';
import logger from '../logger';
import { AuthOptions } from '../models/middleware/AuthOptions';

const verifyAuthHeader = async (header: string, authorizedScopes: Array<string>, allowApiKeyAccess?: boolean) => {
    const [authType, authValue] = header.split(/[ ]+/);
  
    switch (authType.trim().toLowerCase()) {
        case 'bearer':
            try {
                const { scp } = decode(authValue) as JwtPayload
    
                const scopesFromToken = (scp as string).split(' ')

                return authorizedScopes.some(authorizedScope => scopesFromToken.includes(authorizedScope))
            } catch (err) {
                logger.log({
                    level: 'error',
                    message: 'Unable to verify token',
                    error: err
                });
    
                return false;
            }

        case 'apikey':
            return Boolean(allowApiKeyAccess)
    }
};
  
export const authorizationMiddleware = (
    handler: RequestHandler,
    options: AuthOptions
): RequestHandler => async (req: Request, res: Response, next: NextFunction) => {
    const { headers } = req
    const authHeader: string = (headers["Authorization"] ?? headers["authorization"]) as string;

    const { authorizedScopes, allowApiKeyAccess } = options
  
    const authHeaderValid: boolean = await verifyAuthHeader(authHeader, authorizedScopes, allowApiKeyAccess);
  
    if (!authHeaderValid) {
        next(new UnauthorizedError('Unable to authorize request'));
    }
  
    try {
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
  
export default authorizationMiddleware;
  