import dotenv from 'dotenv';
import compression from 'compression';
import path from 'path';
import express, { Request, Response, NextFunction } from 'express';
import ApplicationError from './errors/ApplicationError';
import routes from './routes';
import logger from './logger';

const result = dotenv.config();

if (result.error) {
  dotenv.config({ path: '.env.default' });
}

const PORT = process.env.PORT || 80;

const app = express();

function logResponseTime(req: Request, res: Response, next: NextFunction) {
    const startHrTime = process.hrtime();

    res.on('finish', () => {
        const elapsedHrTime = process.hrtime(startHrTime);
        const elapsedTimeInMs = elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6;
        const message = `${req.method} ${res.statusCode} ${elapsedTimeInMs}ms\t${req.path}`;
        logger.log({
            level: 'debug',
            message,
            consoleLoggerOptions: { label: 'API' }
        });
    });

    next();
}

app.use(logResponseTime);
app.use(compression());
app.use(express.json({limit: '25mb'}));
app.use(express.urlencoded({limit: '25mb', extended: true}));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));
app.use(routes);
app.use((err: ApplicationError, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
        return next(err);
    }

    return res.status(err.status || 500).json({
        error: err.message
    });
});

app.listen(PORT, () => {
    // Swagger UI hosted at http://localhost:${PORT}/dev/api-docs
    logger.info(`app running on port: ${PORT}`);
});
