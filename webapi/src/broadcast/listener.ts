import createPostgresSubscriber, { PgParsedNotification, Subscriber } from "pg-listen"
import logger from "../logger"
import { Config } from "../config"
import { handleMessageCreated, handleResourceCreated } from "./event"

const dbNotificationConfigs: { channel: string, handler: (notification: PgParsedNotification, config: Config) => Promise<void> }[] = [
    { channel: 'message_created', handler: handleMessageCreated },
    { channel: 'resource_created', handler: handleResourceCreated },
]

export class NotificationsListener {
    connectionString: string = ''
    errorHandler: (err: Error) => void
    subscriber: Subscriber<{ [channel: string]: any }>
    config: Config

    constructor(connectionString: string, errorHandler: (err: Error) => void, config: Config) {
        this.connectionString = connectionString
        this.errorHandler = errorHandler
        this.config = config
        
        this.subscriber = createPostgresSubscriber({ connectionString: this.connectionString })
        this.subscriber.events.on('connected', () => {
            dbNotificationConfigs.forEach(cfg => this.subscriber.listenTo(cfg.channel))
        })
        this.subscriber.events.on('notification', (notification: PgParsedNotification) => this.onNotification(notification, config))
        this.subscriber.events.on('error', this.errorHandler)
    }

    async connect() {
        await this.subscriber.connect()
    }

    async onNotification(notification: PgParsedNotification, config: Config) {
        try {
            const targetConfig = dbNotificationConfigs.find(cfg => cfg.channel === notification.channel)
            if(!targetConfig){
                logger.warn(`Postgres notfication on unexpected channel ${notification.channel}. Ignoring.`)
                return
            }

            await targetConfig.handler(notification, config)
        } catch(e) { 
            logger.error(`Error while handling Postgres notification ${JSON.stringify(notification)}.`, e)
        }
    }
}