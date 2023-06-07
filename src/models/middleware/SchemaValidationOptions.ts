import { ObjectSchema } from '@hapi/joi';

export interface SchemaValidationOptions {
    validation?: {
        body?: ObjectSchema
    }
};