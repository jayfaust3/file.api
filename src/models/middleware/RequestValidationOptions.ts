import { AuthOptions } from './AuthOptions';
import { SchemaValidationOptions } from './SchemaValidationOptions';

export interface RequestValidationOptions {
    auth: AuthOptions,
    schema?: SchemaValidationOptions
}
