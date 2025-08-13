import { PgParsedNotification } from "pg-listen"
import { Config } from "../config"
import { PushNotification, sendPushNotification } from "../pushNotifications"
import logger from "../logger"
import initTranslations from '../i18n'
import { TFunction } from "i18next"
import { runAndLog } from "../db_jobs/utils"
import { Pool } from "pg"
import { makeNotificationInfo } from "./common"

interface NewMessageNotificationPayload {
    messageId: number
    text: string
    sender: string
    resourceId: number
    otherAccountId: number
    otherAccountName: string
    pushToken: string
}

interface MessagePayload {
    message_id: number
    text: string
    sender: string
    resource_id: number
    other_account_id: number
    other_account_name: string
    push_token: string
    }

const toMessageNotification = (payload: MessagePayload): NewMessageNotificationPayload => ({
    messageId: payload.message_id,
    text: payload.text || '<Image>',
    sender: payload.sender,
    resourceId: payload.resource_id,
    otherAccountId: payload.other_account_id,
    otherAccountName: payload.other_account_name,
    pushToken: payload.push_token
})

export const handleMessageCreated = async (notification: PgParsedNotification, config: Config, pool: Pool) => {
    if(!notification.payload) throw new Error('Expected payload on notification, got none')

    try {
        const messageNotif = toMessageNotification(notification.payload)
        await sendPushNotification([ { to: messageNotif.pushToken, body: messageNotif.text, title: messageNotif.sender, data: {
            url: `${config.pushNotificationsUrlPrefix}conversation?resourceId=${messageNotif.resourceId}&otherAccountId=${messageNotif.otherAccountId}&otherAccountName=${encodeURIComponent(messageNotif.otherAccountName)}`
        }} ], config, pool)
    } catch(e) {
        logger.error(`Error while sending push notification to Expo.`, e)
    }
}

export const handleResourceCreated = async (notification: PgParsedNotification, config: Config, pool: Pool) => {
    try {
        //Find all accounts that can be suggested the new resource
        const cmdResult = await runAndLog(`SELECT sb.get_accounts_to_notify_of_new_resource(${notification.payload.resource_id});`,
            pool, `Gathering accounts to notifiy for new resource ${JSON.stringify(notification.payload)}`)
    
        const accountsToNotify = cmdResult.rows[0][Object.getOwnPropertyNames(cmdResult.rows[0])[0]]

        if(accountsToNotify.length > 0) {
            //Create a resource notification for all such accounts
            await runAndLog(`SELECT sb.create_new_resource_notifications($1, $2);`, pool, 
                `Creating notifications for new resource ${JSON.stringify(notification.payload)}, accounts ${accountsToNotify}`,
                [notification.payload.resource_id, accountsToNotify]
            )
        
            const notifsToPushRes =  await runAndLog(`SELECT token, r.id as resourceId, r.title, creator.name as accountName, destinator.language
                FROM sb.accounts_push_tokens apt
                INNER JOIN sb.resources r ON r.id = $1
                INNER JOIN sb.accounts creator ON creator.id = r.account_id
                INNER JOIN sb.accounts destinator ON destinator.id = apt.account_id
                LEFT JOIN sb.broadcast_prefs bp ON bp.account_id = apt.account_id AND event_type = 2 AND days_between_summaries IS NOT NULL
                WHERE bp.id IS NULL
                AND apt.account_id = ANY($2)`, pool, `Sending push notifications for new resource ${JSON.stringify(notification.payload)}`,
                [notification.payload.resource_id,accountsToNotify]
            )
        
            const ts: {[ lang: string ]: TFunction<"translation", undefined>} = {}
            const languages: string[] = []
            notifsToPushRes.rows.forEach(async dest => {
                if(!languages.includes(dest.language)) languages.push(dest.language)
            })
            await Promise.all(languages.map(async lang => ts[lang] = await initTranslations(lang)))
        
            try {
                //Send push notification to all such accounts configured for push notifications
                await sendPushNotification(notifsToPushRes.rows.map(dest => {
                    return {
                        to: dest.token,
                        body: `${ts[dest.language]('new_resource_notification')} ${dest.title}`, 
                        title: dest.accountName, 
                        data: {
                            url: `${config.pushNotificationsUrlPrefix}viewresource?resourceId=${dest.resourceId}`
                        }
                    }
                }), config, pool)
            } catch(e) {
                logger.error(`Error while sending push notification to Expo.`, e)
            }
        }
    } catch(e) {
        logger.error(`Error while registering notifications for new resource.`, e)
    }
}

const createPushNotificationFromNotifInfo = (token: string, data: object, urlPrefix: string, t: TFunction<"translation", undefined>): PushNotification => {
    const notificationInfo = makeNotificationInfo(data, t)

    return {
        to: token, title: notificationInfo.title, data: {
            url: `${urlPrefix}notifications`
        }, body: notificationInfo.summary
    }
}

export const handleNotificationCreated = async (notification: PgParsedNotification, config: Config, pool: Pool) => {
    try {
        const ts: {[ lang: string ]: TFunction<"translation", undefined>} = {}
        const languages: string[] = ['fr', 'en']

        await Promise.all(languages.map(async lang => ts[lang] = await initTranslations(lang)))

        const notifRecord = await runAndLog(`SELECT n.data, apt.token, a.language FROM sb.notifications n
            INNER JOIN sb.accounts a ON a.id = n.account_id
            INNER JOIN sb.accounts_push_tokens apt ON apt.account_id = n.account_id
            WHERE n.id = ($1)`, pool, 
            `Gather notification data for push notification ${notification.payload.notification_id}`, 
            [notification.payload.notification_id])

        if(notifRecord.rowCount != 1) throw new Error(`Unexpected number of records ${notifRecord.rowCount} when querying for notification with id ${notification.payload.notification_id}. There is probably no push notification token for this account`)
        console.log('ts[notifRecord.rows[0].language]', notifRecord.rows[0].language, ts[notifRecord.rows[0].language], ts)

        const notifToPush = createPushNotificationFromNotifInfo(notifRecord.rows[0].token,
            notifRecord.rows[0].data, config.pushNotificationsUrlPrefix, ts[notifRecord.rows[0].language] )

        try {
            await sendPushNotification([notifToPush], config, pool)
        } catch(e) {
            logger.error(`Error while sending push notification to Expo.`, e)
        }
    } catch(e) {
        logger.error(`Error while preparing notification for sending.`, e)
    }
}