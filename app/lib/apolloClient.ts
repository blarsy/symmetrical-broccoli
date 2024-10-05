import { createHttpLink, split, ApolloLink, ApolloClient, from, InMemoryCache } from "@apollo/client"
import { setContext } from "@apollo/client/link/context"
import { ErrorResponse, onError } from "@apollo/client/link/error"
import { GraphQLWsLink } from "@apollo/client/link/subscriptions"
import { getMainDefinition } from "@apollo/client/utilities"
import { createClient } from "graphql-ws"
import { debug, info, error } from "./logger"
import { graphQlApiUrl, subscriptionsUrl } from "./settings"
import { errorToString, apolloTokenExpiredHandler } from "./utils"

const errorsToString = (es: readonly Error[]) => es.map(errorToString).join(', ')

const errorStringFromResponse = (e:ErrorResponse) => {
    const ae = e as ErrorResponse
    return `ApolloError: operation ${ae.operation.operationName} ${JSON.stringify(ae.operation.variables)}
      ${ae.graphQLErrors && ae.graphQLErrors.length > 0 && `, graphQLErrors: ${errorsToString(ae.graphQLErrors)}`}, 
      ${ae.networkError && `, networkError: ${errorToString(ae.networkError)}`}`
}

export const getApolloClient = (token: string) => {
    let webSocketImpl
    let customFetch
    if(typeof WebSocket  === 'undefined') {
      // This is required to run Jest tests under NodeJs
      const ws = require('ws')
      //console.debug('ws', ws)
      webSocketImpl = ws
    }
    if(typeof fetch === 'undefined') {
      customFetch = require('cross-fetch')
    }

    const httpLink = createHttpLink({ uri: graphQlApiUrl, fetch: customFetch || undefined })
    const wsLink = new GraphQLWsLink(
      createClient({ 
        url: subscriptionsUrl,
        shouldRetry: e => true, 
        retryAttempts: 5, 
        webSocketImpl,
        connectionParams: { authorization: `Bearer ${token}` } })
    )
    
    const authLink = setContext(async (_, { headers }) => {
      if(token) {
        return {
            headers: {
            ...headers,
            authorization: `Bearer ${token}`,
            }
        }
      }
      return { headers }
    })

    const wsSplitLink = split(
      ({ query }) => {
        const definition = getMainDefinition(query)
        return (
          definition.kind === 'OperationDefinition' &&
          definition.operation === 'subscription'
        )
      },
      wsLink,
      httpLink
    )

    const makeVariablesSafe = (vars: Record<string, any>) => {
      const sanitizedVars = { ...vars }
      Object.getOwnPropertyNames(vars).forEach(propName => {
        if(['password', 'Password'].includes(propName) ) {
          sanitizedVars[propName] = '<undisclosed>'
        }
      })

      return sanitizedVars
    }

    const traceLink = new ApolloLink((operation, forward) => {
      try {
        debug({ message: `Operation: ${operation.operationName}, query ${JSON.stringify(operation.query)}, variables: ${JSON.stringify(makeVariablesSafe(operation.variables))}` })
      }
      finally {
        return forward(operation)
      }
    })
    
    return new ApolloClient({
      link: from([
        traceLink,
        onError((e: ErrorResponse) => {
          if(e.graphQLErrors && e.graphQLErrors.length > 0 && e.graphQLErrors.some(error => error.message === 'jwt expired' || error.message === 'invalid signature')){
            info({ message: 'Token expired' })
            apolloTokenExpiredHandler.handle()
          } else {
            error({ message: errorStringFromResponse(e) })
          }
        }),
        authLink,
        wsSplitLink
      ]),
      cache: new InMemoryCache(),
      defaultOptions: {
        watchQuery: {
          fetchPolicy: 'cache-and-network'
        }
      }
    })
}
