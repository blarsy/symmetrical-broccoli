import { makeExtendSchemaPlugin, gql, embed } from "graphile-utils"
import logger from "./logger"

const newMessageTopicFromContext = async (_args: any, context: any, _resolveInfo: any) => {
  logger.info(`creating message topic graphql:message_account:${context.jwtClaims.account_id}`)
  if (context.jwtClaims.account_id) {
    return `graphql:message_account:${context.jwtClaims.account_id}`
  } else {
    throw new Error("You're not logged in")
  }
}

const newNotificationTopicFromContext = async (_args: any, context: any, _resolveInfo: any) => {
  logger.info(`creating notification topic graphql:notification_account:${context.jwtClaims.account_id}`)
  if (context.jwtClaims.account_id) {
    return `graphql:notification_account:${context.jwtClaims.account_id}`
  } else {
    throw new Error("You're not logged in")
  }
}

const newAccountChangeTopicFromContext = async (_args: any, context: any, _resolveInfo: any) => {
  logger.info(`creating notification topic graphql:account_changed:${context.jwtClaims.account_id}`)
  if (context.jwtClaims.account_id) {
    return `graphql:account_changed:${context.jwtClaims.account_id}`
  } else {
    throw new Error("You're not logged in")
  }
}

const v0_8Plugin = makeExtendSchemaPlugin(({ pgSql: sql }) => {
  const typeDefs = gql`
    type MessageSubscriptionPayload {
      # This is populated by our resolver below
      message: Message

      # This is returned directly from the PostgreSQL subscription payload (JSON object)
      event: String
    }

    type NotificationSubscriptionPayload {
      notification: Notification
      event: String
    }

    extend type Subscription {
      messageReceived: MessageSubscriptionPayload @pgSubscription(topic: ${embed(newMessageTopicFromContext)})
      notificationReceived: NotificationSubscriptionPayload @pgSubscription(topic: ${embed(newNotificationTopicFromContext)})
    }
  `
  return {
    typeDefs,
    resolvers: {
      MessageSubscriptionPayload: {
        async message(
          event,
          _args,
          _context,
          { graphile: { selectGraphQLResultFromTable } }
        ) {
          const rows = await selectGraphQLResultFromTable(
            sql.fragment`sb.messages`,
            (tableAlias, sqlBuilder) => {
              sqlBuilder.where(
                sql.fragment`${tableAlias}.id = ${sql.value(event.subject)}`
              )
            }
          )
          logger.info(`Returning from message subscription: ${JSON.stringify(rows[0])}`)
          return rows[0]
        },
      },
      NotificationSubscriptionPayload: {
        async notification(
          event,
          _args,
          _context,
          { graphile: { selectGraphQLResultFromTable } }
        ) {
          const rows = await selectGraphQLResultFromTable(
            sql.fragment`sb.notifications`,
            (tableAlias, sqlBuilder) => {
              sqlBuilder.where(
                sql.fragment`${tableAlias}.id = ${sql.value(event.subject)}`
              )
            }
          )
          logger.info(`Returning from notification subscription: ${JSON.stringify(rows[0])}`)
          return rows[0]
        },
      }
    },
  }
})

const v0_9Plugin = makeExtendSchemaPlugin(({ pgSql: sql }) => {
  const typeDefs = gql`
    type MessageSubscriptionPayload {
      message: Message
      event: String
    }

    type NotificationSubscriptionPayload {
      notification: Notification
      event: String
    }

    type AccountChangePayload {
      account: Account
      event: String
    }

    extend type Subscription {
      messageReceived: MessageSubscriptionPayload @pgSubscription(topic: ${embed(newMessageTopicFromContext)})
      notificationReceived: NotificationSubscriptionPayload @pgSubscription(topic: ${embed(newNotificationTopicFromContext)})
      accountChangeReceived: AccountChangePayload @pgSubscription(topic: ${embed(newAccountChangeTopicFromContext)})
    }
  `
  return {
    typeDefs,
    resolvers: {
      MessageSubscriptionPayload: {
        async message(
          event,
          _args,
          _context,
          { graphile: { selectGraphQLResultFromTable } }
        ) {
          const rows = await selectGraphQLResultFromTable(
            sql.fragment`sb.messages`,
            (tableAlias, sqlBuilder) => {
              sqlBuilder.where(
                sql.fragment`${tableAlias}.id = ${sql.value(event.subject)}`
              )
            }
          )
          logger.info(`Returning from message subscription: ${JSON.stringify(rows[0])}`)
          return rows[0]
        },
      },
      NotificationSubscriptionPayload: {
        async notification(
          event,
          _args,
          _context,
          { graphile: { selectGraphQLResultFromTable } }
        ) {
          const rows = await selectGraphQLResultFromTable(
            sql.fragment`sb.notifications`,
            (tableAlias, sqlBuilder) => {
              sqlBuilder.where(
                sql.fragment`${tableAlias}.id = ${sql.value(event.subject)}`
              )
            }
          )
          logger.info(`Returning from notification subscription: ${JSON.stringify(rows[0])}`)
          return rows[0]
        },
      },
      AccountChangePayload: {
        async account(
          event,
          _args,
          _context,
          { graphile: { selectGraphQLResultFromTable } }
        ) {
          const rows = await selectGraphQLResultFromTable(
            sql.fragment`sb.accounts`,
            (tableAlias, sqlBuilder) => {
              sqlBuilder.where(
                sql.fragment`${tableAlias}.id = ${sql.value(event.subject)}`
              )
            }
          )
          logger.info(`Returning from account change subscription: ${JSON.stringify(rows[0])}`)
          return rows[0]
        },
      }
    },
  }
})

export default (version: string) => {
  if(version === 'v0_9') {
    return v0_9Plugin
  } else {
    return v0_8Plugin
  }
}