import { makeExtendSchemaPlugin, gql, embed } from "graphile-utils"
import { loggers } from "./logger"

const getTopicFromContext = (subTopic: string) =>
  async (_args: any, context: any, _resolveInfo: any) => {
    if (context.jwtClaims.account_id) {
      return `graphql:${subTopic}:${context.jwtClaims.account_id}`
    } else {
      throw new Error("You're not logged in")
    }
}

const makePlugin = (version: string) => {
  const logger = loggers[version]

  return makeExtendSchemaPlugin(({ pgSql: sql }) => {
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
          account: SessionDatum
          event: String
        }
    
        extend type Subscription {
          messageReceived: MessageSubscriptionPayload @pgSubscription(topic: ${embed(getTopicFromContext('message_account'))})
          notificationReceived: NotificationSubscriptionPayload @pgSubscription(topic: ${embed(getTopicFromContext('notification_account'))})
          accountChangeReceived: AccountChangePayload @pgSubscription(topic: ${embed(getTopicFromContext('account_changed'))})
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
                sql.fragment`(SELECT * FROM sb.get_session_data_web())`,
                (tableAlias, sqlBuilder) => {
                  sqlBuilder.where(
                    sql.fragment`${tableAlias}.account_id = ${sql.value(event.subject)}`
                  )
                }
              )
              logger.info(`Returning from account change subscription: ${JSON.stringify(rows[0])}`)
              return rows[0]
            },
          }
        },
      }
    }
  )

}

export default (version: string) => {
  return makePlugin(version)
}