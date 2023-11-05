import { createLogger, format, transports, LogCallback } from "winston"
import settings from './settings.js'

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
                new transports.File({ filename: settings.logPath + 'error.log', level: 'error' }),
                new transports.File({ filename: settings.logPath + 'combined.log' }),
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
    if(e instanceof Error) {
        return `${e.message}\n${e.stack}`
    }
    return JSON.stringify(e)
}

export const logData = (context: string, resultOrError: any, isError?: boolean) => {
    if(isError) {
      logger!.error(context, resultOrError)
    } else {
      logger!.info(`${context}. ${JSON.stringify(resultOrError)}`)
    }
  }

export default logger!