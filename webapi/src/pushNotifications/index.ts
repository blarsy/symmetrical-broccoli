import { Pool } from "pg"
import { Config } from "../config"
import { runAndLog } from "../db_jobs/utils"
import { loggers } from "../logger"

export interface PushNotification {
    to: string,
    title: string,
    body: string,
    data: object
}

export async function sendPushNotification(messages: PushNotification[], config: Config, pool: Pool) {
    loggers[config.version].info(`Push notifications ${JSON.stringify(messages)}.`)

    if(!config.versions[config.version].doNotSendPushNotifs) {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages.map(m => ({ ...m, priority: 'high' }))),
      })
    }

    return runAndLog(`INSERT INTO sb.push_notifications(messages) VALUES (($1))`, pool, 'Persisting sending push message(s).', config.version, [JSON.stringify(messages)])
}