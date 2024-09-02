import { PgParsedNotification } from "pg-listen"
import { Config, getCommonConfig, getConnectionString } from "../config"
import { sendPushNotification } from "../pushNotifications"
import logger from "../logger"
import initTranslations from '../i18n'
import { TFunction } from "i18next"
import { runAndLog } from "../db_jobs/utils"

export enum EventType {
    messageCreated = 1,
    resourceCreated = 2
}

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

export const handleMessageCreated = async (notification: PgParsedNotification, config: Config) => {
    if(!notification.payload) throw new Error('Expected payload on notification, got none')

    try {
        const messageNotif = toMessageNotification(notification.payload)
        const config = await getCommonConfig()
        await sendPushNotification([ { to: messageNotif.pushToken, body: messageNotif.text, title: messageNotif.sender, data: {
            url: `${config.pushNotificationsUrlPrefix}conversation?resourceId=${messageNotif.resourceId}&otherAccountId=${messageNotif.otherAccountId}&otherAccountName=${messageNotif.otherAccountName}`
        }} ])
    } catch(e) {
        logger.error(`Error while sending push notification to Expo.`, e)
    }
}

export const handleResourceCreated = async (notification: PgParsedNotification, config: Config) => {

    const connectionString = getConnectionString(config)

    try {
        //Find all accounts that can be suggested the new resource
        const cmdResult = await runAndLog(`SELECT sb.get_accounts_to_notify_of_new_resource(${notification.payload.resource_id});`,
            connectionString, `Gathering accounts to notifiy for new resource ${JSON.stringify(notification.payload)}`)
    
        const accountsToNotify = cmdResult.rows[0][Object.getOwnPropertyNames(cmdResult.rows[0])[0]]

        if(accountsToNotify.length > 0) {
            //Create a resource suggestion for all such accounts
            await runAndLog(`SELECT sb.create_new_resource_notifications($1, $2);`, connectionString, 
                `Creating notifications for new resource ${JSON.stringify(notification.payload)}, accounts ${accountsToNotify}`,
                [notification.payload.resource_id, accountsToNotify]
            )
        
            const notifsToPushRes =  await runAndLog(`SELECT token, r.id as resourceId, r.title, creator.name as accountName, destinator.language
                FROM sb.accounts_push_tokens apt
                INNER JOIN sb.resources r ON r.id = $1
                INNER JOIN sb.accounts creator ON creator.id = r.account_id
                INNER JOIN sb.accounts destinator ON destinator.id = apt.account_id
                WHERE NOT EXISTS (SELECT * FROM sb.broadcast_prefs bp WHERE bp.account_id = apt.account_id)
                AND apt.account_id = ANY($2)`, connectionString, `Sending push notifications for new resource ${JSON.stringify(notification.payload)}`,
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
                }))
            } catch(e) {
                logger.error(`Error while sending push notification to Expo.`, e)
            }
        }
    } catch(e) {
        logger.error(`Error while registering notifications for new resource.`, e)
    }
}