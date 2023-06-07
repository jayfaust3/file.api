import ApplicationError from './ApplicationError';

export default class UnauthorizedError extends ApplicationError {
    constructor(message?: string) {
        super(message || 'Unauthorized request', 403);
    }
}
