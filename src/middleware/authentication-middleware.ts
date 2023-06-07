import {
  RequestHandler, Request, Response, NextFunction
} from 'express';
import { JwtPayload, decode } from 'jsonwebtoken';
import UnauthenticatedError from '../errors/UnauthenticatedError';
import logger from '../logger';

const verifyAuthHeader = async (header: string) => {
    if (header) {
        const authHeaderItems: Array<string> = header.split(/[ ]+/);

        if (authHeaderItems.length > 1) {
            const [authType, authValue] = authHeaderItems;

            const { GOOGLE_OAUTH_AUDIENCE, GOOGLE_OAUTH_ISSUER, SAINT_PORTAL_API_KEY } = process.env;

            switch(authType.trim().toLowerCase()) {
                case 'bearer':
                    try {
                        const { aud, exp, iss, scp } = decode(authValue) as JwtPayload

                        return Boolean(
                            aud === GOOGLE_OAUTH_AUDIENCE && 
                            [GOOGLE_OAUTH_ISSUER].includes(iss) && 
                            exp > Date.now() / 1000
                        );
                    } catch (err) {
                        logger.log({
                            level: 'error',
                            message: 'Unable to verify token',
                            error: err
                        });

                        return false;
                    }

                case 'apikey':
                    return [SAINT_PORTAL_API_KEY].includes(authValue);
            }
        } else {
            return false;
        }
    } else {
        return false;
    }
};

/**
 * This router wrapper catches any error from async await
 * and throws it to the default express error handler,
 * instead of crashing the app
 * @param handler Request handler to check for error
 */
export const authenticationMiddleware = (
    handler: RequestHandler,
): RequestHandler => async (req: Request, res: Response, next: NextFunction) => {
    const authHeader: string = (req.headers["Authorization"] ?? req.headers["authorization"]) as string;

    const authHeaderValid: boolean = await verifyAuthHeader(authHeader);

    if (!authHeaderValid) {
        next(new UnauthenticatedError('Unable to auth request'));
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

export default authenticationMiddleware;
