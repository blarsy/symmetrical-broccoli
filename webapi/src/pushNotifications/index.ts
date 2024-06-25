import { PgParsedNotification } from "pg-listen"
import logger from "../logger"
import { getCommonConfig } from "../config"

export interface PushNotification {
    to: string,
    title: string,
    body: string,
    data: object
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

export async function sendPushNotification(messages: PushNotification[]) {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    })
}

export const sendMessageCreatedPushNotification = async (payload: MessagePayload) => {
  if(!payload) throw new Error('Expected payload on notification, got none')

    try {
        const messageNotif = toMessageNotification(payload)
        logger.info(`Push notification ${JSON.stringify(messageNotif)}.`)
        const config = await getCommonConfig()
        await sendPushNotification([ { to: messageNotif.pushToken, body: messageNotif.text, title: messageNotif.sender, data: {
            url: `${config.pushNotificationsUrlPrefix}conversation?resourceId=${messageNotif.resourceId}&otherAccountId=${messageNotif.otherAccountId}&otherAccountName=${messageNotif.otherAccountName}`
        }} ])
    } catch(e) {
        logger.error(`Error while sending push notification to Expo.`, e)
    }
}