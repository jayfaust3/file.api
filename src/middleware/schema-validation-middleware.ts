import {
    RequestHandler, Request, Response, NextFunction
  } from 'express';
  import { ValidationError } from '@hapi/joi';
  import BadRequestError from '../errors/BadRequestError';
  import logger from '../logger';
  import { SchemaValidationOptions } from '../models/middleware/SchemaValidationOptions';
  
  const getMessageFromJoiError = (error: ValidationError): string | undefined => {
    if (!error.details && error.message) {
        return error.message;
    }
    return error.details && error.details.length > 0 && error.details[0].message
      ? `PATH: [${error.details[0].path}] ;; MESSAGE: ${error.details[0].message}` : undefined;
  };
  
  /**
   * This router wrapper catches any error from async await
   * and throws it to the default express error handler,
   * instead of crashing the app
   * @param handler Request handler to check for error
   */
  export const schemaValidationMiddleware = (
      handler: RequestHandler,
      options?: SchemaValidationOptions
  ): RequestHandler => async (req: Request, res: Response, next: NextFunction) => {  
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
  
  export default schemaValidationMiddleware;
  