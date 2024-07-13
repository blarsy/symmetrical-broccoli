import { PgParsedNotification } from "pg-listen"
import { getCommonConfig } from "../config"
import { sendPushNotification } from "../pushNotifications"
import logger from "../logger"

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

interface NewResourcePayload {
    resource_id: number
    title: string
    account_name: string
    push_tokens: string[]
}

interface NewResourceNotificationPayload {
    resourceId: number
    title: string
    accountName: string
    pushTokens: string[]
}

const toResourceNotification = (payload: NewResourcePayload): NewResourceNotificationPayload => ({
    accountName: payload.account_name,
    resourceId: payload.resource_id,
    pushTokens: payload.push_tokens,
    title: payload.title
})

export const handleMessageCreated = async (notification: PgParsedNotification) => {
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

export const handleResourceChange = async (notification: PgParsedNotification) => {
    if(!notification.payload) throw new Error('Expected payload on notification, got none')

    try {
        const resourceNotif = toResourceNotification(notification.payload)
        if(resourceNotif.pushTokens.length > 0) {
            const config = await getCommonConfig()
            await sendPushNotification(resourceNotif.pushTokens.map( pushToken =>  ({ 
                to: pushToken,
                body: resourceNotif.title, 
                title: resourceNotif.accountName, 
                data: {
                    url: `${config.pushNotificationsUrlPrefix}resource/viewresource?resourceId=${resourceNotif.resourceId}`
                }
            })))
        }
    } catch(e) {
        logger.error(`Error while sending push notification to Expo.`, e)
    }
}