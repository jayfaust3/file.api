import {
  RequestHandler, Request, Response, NextFunction
} from 'express';
import { ValidationError } from '@hapi/joi';
import { JwtPayload, decode } from 'jsonwebtoken';
import BadRequestError from '../errors/BadRequestError';
import UnauthorizedError from '../errors/UnauthorizedError';
import logger from '../logger';
import { HandlerOptions } from '../models/middleware/HandlerOptions';

const getMessageFromJoiError = (error: ValidationError): string | undefined => {
  if (!error.details && error.message) {
      return error.message;
  }
  return error.details && error.details.length > 0 && error.details[0].message
    ? `PATH: [${error.details[0].path}] ;; MESSAGE: ${error.details[0].message}` : undefined;
};

const verifyAuthHeader = async (header: string) => {
    if (header) {
        const authHeaderItems: Array<string> = header.split(/[ ]+/);

        if (authHeaderItems.length > 1) {
            const authHeaderPrefix: string = authHeaderItems[0].trim().toLowerCase();

            const { GOOGLE_OAUTH_AUDIENCE, GOOGLE_OAUTH_ISSUER, SAINT_PORTAL_API_KEY } = process.env;

            switch(authHeaderPrefix) {
                case 'bearer':
                    const [_, encodedToken] = authHeaderItems;

                    try {
                        const { aud, exp, iss, scp } = decode(encodedToken) as JwtPayload

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
                    const apikey: string = authHeaderItems[1];

                    return [SAINT_PORTAL_API_KEY].includes(apikey);
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
export const requestMiddleware = (
    handler: RequestHandler,
    options?: HandlerOptions
): RequestHandler => async (req: Request, res: Response, next: NextFunction) => {
    const authHeader: string = (req.headers["Authorization"] ?? req.headers["authorization"] )as string;

    const authHeaderValid: boolean = await verifyAuthHeader(authHeader);

    if (!authHeaderValid) {
        next(new UnauthorizedError('Unable to authenticate request'));
    }

    if (options?.validation?.body) {
        const { error } = options?.validation?.body.validate(req.body);

        if (error) {
            next(new BadRequestError(getMessageFromJoiError(error)));

            return;
        }
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

export default requestMiddleware;
