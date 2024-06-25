import createPostgresSubscriber, { PgParsedNotification, Subscriber } from "pg-listen"
import logger from "../logger"
import { Config } from "../config"

interface DbNotificationConfig {
    channel: string,
    handler: (notification: PgParsedNotification, config: Config) => Promise<void>
}

export class NotificationsListener {
    connectionString: string = ''
    errorHandler: (err: Error) => void
    subscriber: Subscriber<{ [channel: string]: any }>
    notificationConfigs: DbNotificationConfig[]
    config: Config

    constructor(connectionString: string, errorHandler: (err: Error) => void, config: Config, notificationConfigs: DbNotificationConfig[]) {
        this.connectionString = connectionString
        this.errorHandler = errorHandler
        this.notificationConfigs = notificationConfigs
        this.config = config
        
        this.subscriber = createPostgresSubscriber({ connectionString: this.connectionString })
        this.subscriber.events.on('connected', () => {
            notificationConfigs.forEach(cfg => this.subscriber.listenTo(cfg.channel))
        })
        this.subscriber.events.on('notification', this.onNotification)
        this.subscriber.events.on('error', this.errorHandler)
        this.subscriber.connect()
    }

    async onNotification(notification: PgParsedNotification) {
        const targetConfig = this.notificationConfigs.find(cfg => cfg.channel === notification.channel)
        if(!targetConfig){
            logger.warn(`Postgres notfication on unexpected channel ${notification.channel}. Ignoring.`)
            return
        }

        try {
            await targetConfig.handler(notification, this.config)
        } catch(e) {
            logger.error(`Error while handling Postgres notification ${notification}.`, e)
        }
    }
}