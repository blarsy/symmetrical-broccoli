import { createLogger, format, transports } from "winston"
import { getCommonConfig } from "./config"

const logger: {
    initialized: boolean
    error: (message: string, err: any) => void
    info: (message: string) => void
    warn: (message: string) => void
} = {
    initialized: false,
    error: () => { throw new Error('Logger still uninitialized, please first call "init"') },
    warn: () => { throw new Error('Logger still uninitialized, please first call "init"') },
    info: () => { throw new Error('Logger still uninitialized, please first call "init"') }
}

export const init = async () => {
    const config = await getCommonConfig()
    if(!logger.initialized) {
        const winstonLogger = createLogger({
            level: 'info',
            format: format.combine(
                format.timestamp(),
                format.json()
            ),
            transports: [
                new transports.File({ filename: config.logPath + 'error.log', level: 'error', maxsize: 5000000, maxFiles: 3 }),
                new transports.File({ filename: config.logPath + 'combined.log', maxsize: 5000000, maxFiles: 3 }),
            ],
        })
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
}

const parseError = (e: any) => {
    return `name: ${e.name}\nmessage: ${e.message}\nstack: ${e.stack}`
}

export default logger