import createPostgresSubscriber, { PgParsedNotification, Subscriber } from "pg-listen"

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

    onNotification(notification: PgParsedNotification) {
        console.log('NOTIF !!', JSON.stringify(notification))
        if(!notification.payload) throw new Error('Expected payload on notification, got none')

        
    }
}