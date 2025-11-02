import { createLogger, format, transports } from "winston"
import { Config, getConnectionString } from "./config"
import { PostgresTransport } from '@innova2/winston-pg'

interface Logger {
    initialized: boolean
    error: (message: string, error: any) => void
    warn: (message: string) => void
    info: (message: string) => void
}

export const loggers: {[version:string] :Logger} = {}

export const init = async (config: Config) => {
    const logger: Logger = {
        initialized: false,
        error: () => { throw new Error('Logger still uninitialized, please first call "init"') },
        warn: () => { throw new Error('Logger still uninitialized, please first call "init"') },
        info: () => { throw new Error('Logger still uninitialized, please first call "init"') }
    }

    if(!logger.initialized) {
        const fallbackLogger = createLogger({
            level: 'info',
            format: format.combine(
                format.timestamp(),
                format.json()
            ),
            transports: [
                new transports.File({ filename: config.logPath + 'error.log', level: 'error', maxsize: 5000000, maxFiles: 3 }),
            ],
        })
        const winstonLogger = createLogger({
            level: 'info',
            format: format.combine(
                format.timestamp(),
                format.json()
            ),
            transports: [
                new PostgresTransport({
                    connectionString: getConnectionString(config),
                    maxPool: 10,
                    level: 'info',
                    tableName: 'server_logs',
                    schema: 'sb'
                })
            ]
        })
        winstonLogger.on('error', err => fallbackLogger.error(err.toString()))

        logger.error =  (message: string, error: any) => {
            const content = `${message} ${parseError(error)}`
            if(!config.production) console.log(content)
            winstonLogger.error(content)
        }
        logger.info = (message: string) => {
            if(!config.production) console.log(message)
            winstonLogger.info(message)
            
        }
        logger.warn = (message: string) => {
            if(!config.production) console.log(message)
            winstonLogger.warn(message)
        }
        logger.initialized = true
    }

    loggers[config.version] = logger
    return logger
}

const parseError = (e: any) => {
    return `name: ${e.name}\nmessage: ${e.message}\nstack: ${e.stack}`
}