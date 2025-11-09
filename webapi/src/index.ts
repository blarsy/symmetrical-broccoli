import express from "express"
import postgraphile from "./postgraphile"
import getConfig, { Config, createPool, getConnectionString, getVersions } from './config'
import cors from 'cors'
import { JobHelpers, run } from "graphile-worker"
import { sendAccountRecoveryMail, sendEmailActivationCode } from "./mailing"
import { NotificationsListener } from "./broadcast/listener"
import { init, loggers } from "./logger"
import { dailyBackup } from "./db_jobs/jobs"
import { runAndLog } from "./db_jobs/utils"
import { sendSummaries } from "./broadcast/delayedNotifications"
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import dayjs from "dayjs"
import googleAuth from "./googleAuth"
import { Pool } from "pg"
import appleAuth from "./appleAuth"
import adminAuth from "./adminAuth"

dayjs.extend(utc)
dayjs.extend(timezone)

let notificationsListeners: NotificationsListener[] = []

const launchServer = async () => {
    const versions = await getVersions()
    
    versions.forEach(async version => {
        const config = await getConfig(version)
        const connectionString = getConnectionString(config)
        const logger = await init(config)
        const pool = createPool(config, 'webapi')
        launchPostgraphileWebApi(config, pool)
        launchJobWorker(pool, version).catch(e => console.error(e))
        logger.info(`Job worker launched over database ${config.db} on ${config.host}`)
        logger.info(`Connecting to notifier ${version}`)
        notificationsListeners.push(await launchPushNotificationsSender(connectionString, config, pool))
    })
}

const launchPostgraphileWebApi = (config: Config, pool: Pool) => {
    const logger = loggers[config.version]
    const app = express()
    const allowedOrigins = JSON.parse(config.webClientUrls!) as string[]
    const corsMiddleware = cors({ origin(requestOrigin, callback) {
        if(requestOrigin) {
            if(allowedOrigins.some(org => requestOrigin.toLowerCase() === org.toLocaleLowerCase() || requestOrigin.toLowerCase() === org.toLocaleLowerCase() + '/')) {
                callback(null, requestOrigin)
            } else {
                logger.error(`${requestOrigin} rejected. Allowed origins are ${allowedOrigins}`, new Error('Disallowed'))
                callback(new Error('Disallowed'))
            }
        } else {
            //Client did not request CORS
            callback(null, requestOrigin)
        }
    }})

    app.all('*', corsMiddleware)

    googleAuth(app, pool, config.googleAuthAudience, config.googleApiSecret, corsMiddleware, config.version)
    appleAuth(app, pool, corsMiddleware, config.version)
    adminAuth(app, pool, corsMiddleware, config.version)

    app.use(postgraphile(config))
    
    app.listen(config.apiPort)
    logger.info(`Express web api server for versions ${config.version} listening on port ${config.apiPort}.`)
}

const executeJob = async (executor: (payload?: any, helpers?: JobHelpers) => Promise<void>, jobName: String, version: string, payload?: any, helpers?: JobHelpers) => {
    const logger = loggers[version]
    try {
        await executor(payload, helpers)
        logger.info(`Successfully executed job ${jobName}, with payload ${JSON.stringify(payload)}`)
    } catch(e) {
        logger.error(`Error while executing job ${jobName}, with payload ${JSON.stringify(payload)}`, e)
    }
}

const launchJobWorker = async (pool: Pool, version: string) => {
    let crontab = '0 0 * * * databaseBackup\n0 0 * * * cleanOldClientLogs\n0 0 * * * cleanOldServerLogs\n0 8 * * * sendSummaries\n*/10 * * * * burnTokens\n0 1 * * * cleanOldNotifications\n*/10 * * * * handleResourcesAndBidsExpiration\n0 1 * * * cleanupOldSearches\n*/10 * * * * applyAirdrop\n'

    const runner = await run({
        pgPool: pool,
        concurrency: 5,
        // Install signal handlers for graceful shutdown on SIGINT, SIGTERM, etc
        noHandleSignals: false,
        crontab,
        taskList : {
            mailPasswordRecovery: async (payload: any) => {
                executeJob(async (payload) => {
                    const { email, code, lang } = payload
                    await sendAccountRecoveryMail(email, code, lang, version, pool)
                }, 'mailPasswordRecovery', version, payload)
            },
            mailActivation: async (payload: any) =>{
                executeJob(async (payload) => {
                    const { email, code, lang } = payload
                    await sendEmailActivationCode(email, code, lang, version, pool)
                }, 'mailActivation', version, payload)
            },
            databaseBackup: async () => {
                executeJob(dailyBackup, 'databaseBackup', version, { version })
            },
            cleanOldClientLogs: async () => {
                const daysOfLogToKeep = 7
                executeJob(async () => {
                    await runAndLog(`DELETE FROM sb.client_logs
                        WHERE created < to_timestamp(extract(epoch from now() - interval '${daysOfLogToKeep} day'));`, pool, 'Running client logs cleanup', version)
                }, 'cleanOldClientLogs', version)
            },
            cleanOldServerLogs: async () => {
                const daysOfLogToKeep = 7
                executeJob(async () => {
                    await runAndLog(`DELETE FROM sb.server_logs
                        WHERE timestamp < to_timestamp(extract(epoch from now() - interval '${daysOfLogToKeep} day'));`, pool, 'Running server logs cleanup', version)
                }, 'cleanOldServerLogs', version)
            },
            cleanOldNotifications: async () => {
                const daysOfNotificationsToKeep = 5
                executeJob(async () => {
                    await runAndLog(`DELETE FROM sb.notifications
                        WHERE read IS NOT NULL AND created < to_timestamp(extract(epoch from now() - interval '${daysOfNotificationsToKeep} day'));`, pool, 'Running notifications cleanup', version)
                }, 'cleanOldClientLogs', version)
            },
            sendSummaries: async () => {
                executeJob(() => sendSummaries(pool, version), 'sendSummaries', version)
            },
            burnTokens: async () => {
                executeJob(async () => {
                    await runAndLog(`SELECT sb.apply_resources_token_transactions()`, pool, 'Running burnTokens routine', version)
                }, 'burnTokens', version)
            },
            handleResourcesAndBidsExpiration: async () => {
                executeJob(async () => {
                    await runAndLog('SELECT sb.handle_resources_and_bids_expiration()', pool, 'Terminate expired bids, and bids on expired resources', version)
                }, 'handleResourcesAndBidsExpiration', version)
            },
            cleanupOldSearches: async () => {
                executeJob(async () => {
                    await runAndLog('SELECT sb.delete_old_searches()', pool, 'Cleanup old searches', version)
                }, 'cleanupOldSearches', version)                
            },
            applyAirdrop: async () => {
                executeJob(async () => {
                    await runAndLog('SELECT sb.apply_airdrop(); SELECT sb.apply_campaign_announcements()', pool, 'Checking campaign events to apply', version)
                }, 'applyAirdrop', version)
            }
        },
        schema: 'worker'
      })
    
    // Immediately await (or otherwise handled) the resulting promise, to avoid
    // "unhandled rejection" errors causing a process crash in the event of
    // something going wrong.
    await runner.promise
}

const launchPushNotificationsSender = async (connectionString: string, config: Config, pool: Pool) => {
    const listener = new NotificationsListener(connectionString,
        err => loggers[config.version].error('Error handling message created notification.' ,err),
        config, pool)
    
    await listener.connect()
    return listener
}

launchServer()
