import createPostgresSubscriber, { PgParsedNotification, Subscriber } from "pg-listen"
import { sendPushNotification } from "."
import config from "../config"
import logger from "../logger"

interface NewMessageNotificationPayload {
    messageId: number
    text: string
    sender: string
    resourceId: number
    otherAccountId: number
    otherAccountName: string
    pushToken: string
}

const toMessageNotification = (payload: any): NewMessageNotificationPayload => ({
    messageId: payload.message_id,
    text: payload.text || '<Image>',
    sender: payload.sender,
    resourceId: payload.resource_id,
    otherAccountId: payload.other_account_id,
    otherAccountName: payload.other_account_name,
    pushToken: payload.push_token
})

export class NotificationsListener {
    connectionString: string = ''
    errorHandler: (err: Error) => void
    subscriber: Subscriber<{ [channel: string]: any }>

    constructor(connectionString: string, errorHandler: (err: Error) => void) {
        this.connectionString = connectionString
        this.errorHandler = errorHandler
        
        this.subscriber = createPostgresSubscriber({ connectionString: this.connectionString })
        this.subscriber.events.on('connected', () => {
            console.log('Connected to database and starting to listen to Postgres notifications...')
            this.subscriber.listenTo('message_created')
        })
        this.subscriber.events.on('notification', this.onNotification)
        this.subscriber.events.on('error', this.errorHandler)
        this.subscriber.connect()
    }

    async onNotification(notification: PgParsedNotification) {
        if(!notification.payload) throw new Error('Expected payload on notification, got none')

        const messageNotif = toMessageNotification(notification.payload)

        try {
            logger.info(`Push notification ${JSON.stringify(messageNotif)}.`)
            await sendPushNotification([ { to: messageNotif.pushToken, body: messageNotif.text, title: messageNotif.sender, data: {
                url: `${config.pushNotificationsUrlPrefix}conversation?resourceId=${messageNotif.resourceId}&otherAccountId=${messageNotif.otherAccountId}&otherAccountName=${messageNotif.otherAccountName}`
            }} ])
        } catch(e) {
            logger.error(`Error while sending push notification to Expo. Pushtoken: ${messageNotif.pushToken}`, e)
        }
    }
}