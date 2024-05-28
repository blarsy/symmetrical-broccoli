import express from "express"
import postgraphile from "./postgraphile"
import getConfig, { Config, getVersions } from './config'
import cors from 'cors'
import { JobHelpers, run } from "graphile-worker"
import { sendAccountRecoveryMail, sendEmailActivationCode } from "./mailing"
import { NotificationsListener } from "./notifications/listener"
import logger, { init } from "./logger"
import { dailyBackup } from "./db_jobs/backup"
import { cleanOldClientLogsJob } from "./db_jobs/maintenance"

const getConnectionString = async (config: Config) => {
    return `postgres://${config.user}:${config.dbPassword}@${config.host}:${config.port}/${config.db}`
}

const launchServer = async () => {
    const versions = await getVersions()
    
    await init()
    logger.info('Starting server')

    versions.forEach(async version => {
        const config = await getConfig(version)
        const connectionString = await getConnectionString(config)
        launchPostgraphileWebApi(config)
        launchJobWorker(connectionString, version).catch(e => console.error(e))
        logger.info(`Job worker launched over database ${config.db} on ${config.host}`)
        logger.info(`Connecting to notifier ${version}`)
        launchPushNotificationsSender(connectionString)
    })
}

const launchPostgraphileWebApi = (config: Config) => {
    const app = express()
    const allowedOrigins = JSON.parse(config.webClientUrls!) as string[]

    app.options('*', cors({ origin(requestOrigin, callback) {
        if(requestOrigin && allowedOrigins.some(org => requestOrigin.toLowerCase() === org.toLocaleLowerCase() || requestOrigin.toLowerCase() === org.toLocaleLowerCase() + '/')) {
            callback(null, requestOrigin)
        } else {
            logger.error(`${requestOrigin} rejected. Allowed origins are ${allowedOrigins}`, new Error('Disallowed'))
            callback(new Error('Disallowed'))
        }
    }, }))

    app.use(postgraphile(config))
    
    app.listen(config.apiPort)
    logger.info(`Express web api server for versions ${config.version} listening on port ${config.apiPort}.`)
}

const executeJob = async (executor: (payload: any, helpers: JobHelpers) => Promise<void>, payload: any, helpers: JobHelpers, jobName: String) => {
    try {
        await executor(payload, helpers)
        logger.info(`Successfully executed job ${jobName}, with payload ${JSON.stringify(payload)}`)
    } catch(e) {
        logger.error(`Error while executing job ${jobName}, with payload ${JSON.stringify(payload)}`, e)
    }
}

const launchJobWorker = async (connectionString: string, version: string) => {
    const runner = await run({
        connectionString,
        concurrency: 5,
        // Install signal handlers for graceful shutdown on SIGINT, SIGTERM, etc
        noHandleSignals: false,
        crontab: '0 0 * * * databaseBackup\n0 0 * * * cleanOldClientLogs',
        taskList : {
            mailPasswordRecovery: async (payload: any, helpers) => {
                executeJob(async (payload, helpers) => {
                    const { email, code, lang } = payload
                    await sendAccountRecoveryMail(email, code, lang, version)
                }, payload, helpers, 'mailPasswordRecovery')
            },
            mailActivation: async (payload: any, helpers: JobHelpers) =>{
                executeJob(async (payload, helpers) => {
                    const { email, code, lang } = payload
                    await sendEmailActivationCode(email, code, lang, version)
                }, payload, helpers, 'mailActivation')
            },
            databaseBackup: async (payload: any, helpers) => {
                executeJob(dailyBackup, { version }, helpers, 'databaseBackup')
            },
            cleanOldClientLogs: async (payload: any, helpers) => {
                const daysOfLogToKeep = 7
                executeJob(cleanOldClientLogsJob, { daysOfLogToKeep, connectionString }, helpers, 'cleanOldClientLogs')
            }
        },
        schema: 'worker'
      })
    
      // Immediately await (or otherwise handled) the resulting promise, to avoid
      // "unhandled rejection" errors causing a process crash in the event of
      // something going wrong.
      await runner.promise
}

const launchPushNotificationsSender = (connectionString: string) => {
    new NotificationsListener(connectionString, err => logger.error('Error handling message created notification.' ,err))
}

launchServer()
