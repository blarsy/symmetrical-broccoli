import { createLogger, format, transports, Logger, LogCallback } from "winston"
let logger: Logger

const ensureLoaded = () => {
    if(!logger) {
        logger = createLogger({
            level: 'info',
            format: format.combine(
                format.timestamp(),
                format.json()
            ),
            transports: [
              new transports.File({ filename: process.env.LOG_PATH + 'error.log', level: 'error' }),
              new transports.File({ filename: process.env.LOG_PATH + 'combined.log' }),
            ],
        })
    }
}

const parseError = (e: any) => {
    return `name: ${e.name}\nmessage: ${e.message}\nstack: ${e.stack}`
}

export default {
    error: (message: string, error: any, cb?: LogCallback) => {
        ensureLoaded()
        logger.error(`${message} ${parseError(error)}`, cb)
    },
    info: (message: string, cb?: LogCallback) => {
        ensureLoaded()
        logger.info(message, cb)
    }
}