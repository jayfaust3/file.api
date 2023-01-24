import { ObjectSchema } from '@hapi/joi';

export interface HandlerOptions {
    validation?: {
        body?: ObjectSchema
    }
};