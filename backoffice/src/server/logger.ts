import { createLogger, format, transports, LogCallback } from "winston"
let logger: {
    error: (message: string, err: any) => void
    info: (message: string) => void
} | undefined = undefined

if(typeof window === 'undefined') {
    if(!logger) {
        const winstonLogger = createLogger({
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
        logger = {
            error: (message: string, error: any, cb?: LogCallback) => {
                winstonLogger.error(`${message} ${parseError(error)}`, cb)
            },
            info: (message: string, cb?: LogCallback) => {
                winstonLogger.info(message, cb)
            }
        }
    }
} else {
    if(!logger) {
        logger = {
            error: (msg, err) => console.log(`${msg}. Error: ${err}`),
            info: (msg) => console.log(msg)
        }
    }
}

const parseError = (e: any) => {
    return `name: ${e.name}\nmessage: ${e.message}\nstack: ${e.stack}`
}

export const logData = (context: string, resultOrError: object, isError?: boolean) => {
    if(isError) {
      logger!.error(context, resultOrError)
    } else {
      logger!.info(`${context}. ${JSON.stringify(resultOrError)}`)
    }
  }

export default logger!