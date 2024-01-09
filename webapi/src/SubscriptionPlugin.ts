import { makeExtendSchemaPlugin, gql, embed } from "graphile-utils"

const newMessageTopicFromContext = async (_args: any, context: any, _resolveInfo: any) => {
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
        // This method finds the user from the database based on the event
        // published by PostgreSQL.
        //
        // In a future release, we hope to enable you to replace this entire
        // method with a small schema directive above, should you so desire. It's
        // mostly boilerplate.
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
          return rows[0]
        },
      },
    },
  }
})