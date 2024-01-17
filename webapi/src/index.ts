import express from "express"
import postgraphile from "./postgraphile"
import config from './config'
import cors from 'cors'
import { run } from "graphile-worker"
import { sendAccountRecoveryMail } from "./mailing"
import { NotificationsListener } from "./notifications/listener"

const connectionString = `postgres://${config.user}:${config.dbPassword}@${config.host}:${config.port}/${config.db}`

const launchPostgraphileWebApi = () => {
    const allowedOrigins = JSON.parse(config.webClientUrls!) as string[]

    const app = express()
    
    app.options('*', cors({ origin(requestOrigin, callback) {
        if(requestOrigin && allowedOrigins.some(org => requestOrigin.toLowerCase() === org.toLocaleLowerCase())) {
            callback(null, requestOrigin)
        } else {
            callback(new Error('Disallowed'))
        }
    }, }))
    app.use(postgraphile)
    app.listen(3000)
    console.log('Express web api server listening on port 3000.')
}

const launchJobWorker = async () => {
    const runner = await run({
        connectionString,
        concurrency: 5,
        // Install signal handlers for graceful shutdown on SIGINT, SIGTERM, etc
        noHandleSignals: false,
        taskList : {
            mailPasswordRecovery: async (payload: any, helpers) => {
                const { email, code } = payload
                await sendAccountRecoveryMail(email, code)
            }
        },
        schema: 'worker'
      })
    
      // Immediately await (or otherwise handled) the resulting promise, to avoid
      // "unhandled rejection" errors causing a process crash in the event of
      // something going wrong.
      await runner.promise
}

const launchPushNotificationsSender = () => {
    new NotificationsListener(connectionString, err => console.error(err.message))
}

launchJobWorker().catch(e => console.error(e))
launchPostgraphileWebApi()
launchPushNotificationsSender()
