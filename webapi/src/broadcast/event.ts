import { PgParsedNotification } from "pg-listen"
import logger from "../logger"
import { ApolloClient, InMemoryCache } from "@apollo/client"
import { Config } from "../config"
import { sendMessageCreatedPushNotification } from "../pushNotifications"

export enum EventType {
    messageCreated = 1,
    resourceCreated = 2,
    resourceUpdated = 3
}

export default async (type: EventType, payload: any) => {

}

export const handleMessageCreated = async (notification: PgParsedNotification, config: Config) => {
    sendMessageCreatedPushNotification(notification.payload)
}
