import ApplicationError from './ApplicationError';

export default class BadRequestError extends ApplicationError {
    constructor(message?: string) {
        super(message || 'Bad request', 400);
    }
}
