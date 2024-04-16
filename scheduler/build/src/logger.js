import { createLogger, format, transports } from "winston";
import settings from './settings.js';
let logger = undefined;
if (typeof window === 'undefined') {
    if (!logger) {
        const winstonLogger = createLogger({
            level: 'info',
            format: format.combine(format.timestamp(), format.json()),
            transports: [
                new transports.File({ filename: settings.logPath + 'error.log', level: 'error' }),
                new transports.File({ filename: settings.logPath + 'combined.log' }),
            ],
        });
        logger = {
            error: (message, error, cb) => {
                winstonLogger.error(`${message} ${parseError(error)}`, cb);
            },
            info: (message, cb) => {
                winstonLogger.info(message, cb);
            }
        };
    }
}
else {
    if (!logger) {
        logger = {
            error: (msg, err) => console.log(`${msg}. Error: ${err}`),
            info: (msg) => console.log(msg)
        };
    }
}
const parseError = (e) => {
    if (e instanceof Error) {
        return `${e.message}\n${e.stack}`;
    }
    return JSON.stringify(e);
};
export const logData = (context, resultOrError, isError) => {
    if (isError) {
        logger.error(context, resultOrError);
    }
    else {
        logger.info(`${context}. ${JSON.stringify(resultOrError)}`);
    }
};
export default logger;
