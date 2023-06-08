import { ValidationError } from '@hapi/joi';
import { SchemaValidationOptions } from '../../models/middleware/SchemaValidationOptions';
import logger from '../../logger';

const getMessageFromJoiError = (error: ValidationError): string | undefined => {
    if (!error.details && error.message) {
        return error.message;
    }
    return error.details && error.details.length > 0 && error.details[0].message
      ? `PATH: [${error.details[0].path}] ;; MESSAGE: ${error.details[0].message}` : undefined;
};

export const validateRequestBody = (body: unknown, options?: SchemaValidationOptions) => {
    if (options?.validation?.body) {
        const { error } = options?.validation?.body.validate(body);

        if (error) {
            logger.error(`Schema validation error: ${getMessageFromJoiError(error)}`)
            return false;
        }
    }

    return true;
}
