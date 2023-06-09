import { createLogger, format, transports, Logger, LogCallback } from "winston"
let logger: Logger

const ensureLoaded = () => {
    if(!logger) {
        logger = createLogger({
            level: 'info',
            format: format.json(),
            transports: [
              new transports.File({ filename: process.env.LOG_PATH + 'error.log', level: 'error' }),
              new transports.File({ filename: process.env.LOG_PATH + 'combined.log' }),
            ],
        })
    }
}

export default {
    error: (message: string, cb?: LogCallback) => {
        ensureLoaded()
        logger.error(message, cb)
    },
    info: (message: string, cb?: LogCallback) => {
        ensureLoaded()
        logger.info(message, cb)
    }
}