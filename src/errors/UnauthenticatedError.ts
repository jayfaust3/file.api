import ApplicationError from './ApplicationError';

export default class UnauthenticatedError extends ApplicationError {
    constructor(message?: string) {
        super(message || 'Unauthenticated request', 401);
    }
}
