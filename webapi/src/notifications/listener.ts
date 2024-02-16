import createPostgresSubscriber, { PgParsedNotification, Subscriber } from "pg-listen"
import { sendPushNotification } from "."
import config from "../config"
import logger from "../logger"

interface NewMessageNotificationPayload {
    messageId: number
    text: string
    sender: string
    resourceId: number
    pushToken: string
}

const toMessageNotfication = (payload: any): NewMessageNotificationPayload => ({
    messageId: payload.message_id,
    text: payload.text || '<Image>',
    sender: payload.sender,
    resourceId: payload.resource_id,
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
        console.log('NOTIF !!', JSON.stringify(notification))
        if(!notification.payload) throw new Error('Expected payload on notification, got none')

        const messageNotif = toMessageNotfication(notification.payload)

        //{"processId":572,"channel":"message_created","payload":{"message_id":57,"text":"content","sender":"Silex","conversation_id":21}}
        try {
            logger.info(`Push notification ${JSON.stringify(messageNotif)}.`)
            await sendPushNotification([ { to: messageNotif.pushToken, body: messageNotif.text, title: messageNotif.sender, data: {
                url: `${config.pushNotificationsUrlPrefix}conversation?resourceid=${messageNotif.resourceId}`
            }} ])
        } catch(e) {
            logger.error(`Error while sending push notification to Expo. Pushtoken: ${messageNotif.pushToken}`, e)
        }
    }
}