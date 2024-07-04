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

export default makeExtendSchemaPlugin(({ pgSql: sql }) => {
  const typeDefs = gql`
    type MessageSubscriptionPayload {
      # This is populated by our resolver below
      message: Message

      # This is returned directly from the PostgreSQL subscription payload (JSON object)
      event: String
    }

    extend type Subscription {
      messageReceived: MessageSubscriptionPayload @pgSubscription(topic: ${embed(newMessageTopicFromContext)})
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
          logger.info(`Returning from message subscription: ${rows[0]}`)
          return rows[0]
        },
      },
    },
  }
})