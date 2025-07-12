import getConfig from '@/config/index'
import { createHttpLink, split, ApolloClient, from, InMemoryCache, gql } from "@apollo/client"
import { setContext } from "@apollo/client/link/context"
import { getMainDefinition } from "@apollo/client/utilities"
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { createClient } from 'graphql-ws'

// const errorsToString = (es: readonly Error[]) => es.map(errorToString).join(', ')

// const errorStringFromResponse = (e:ErrorResponse) => {
//     const ae = e as ErrorResponse
//     return `ApolloError: operation ${ae.operation.operationName} ${JSON.stringify(ae.operation.variables)}
//       ${ae.graphQLErrors && ae.graphQLErrors.length > 0 && `, graphQLErrors: ${errorsToString(ae.graphQLErrors)}`}, 
//       ${ae.networkError && `, networkError: ${errorToString(ae.networkError)}`}`
// }

export const getApolloClient = (version: string, token?: string) => {
    const config = getConfig(version)
    let webSocketImpl
    let customFetch
    if(typeof WebSocket  === 'undefined') {
      // This is required to run Jest tests under NodeJs
      const ws = require('ws')
      webSocketImpl = ws
    }
    if(typeof fetch === 'undefined') {
      customFetch = require('cross-fetch')
    }

    const httpLink = createHttpLink({ uri: config.graphqlUrl, fetch: customFetch || undefined })
    const wsLink = new GraphQLWsLink(
      createClient({ 
        url: config.subscriptionsUrl,
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

    // const traceLink = new ApolloLink((operation, forward) => {
    //   try {
    //     debug({ message: `Operation: ${operation.operationName}, query ${JSON.stringify(operation.query)}, variables: ${JSON.stringify(makeVariablesSafe(operation.variables))}` })
    //   }
    //   finally {
    //     return forward(operation)
    //   }
    // })
    
    return new ApolloClient({
      link: from([
        // traceLink,
        // onError((e: ErrorResponse) => {
        //   if(e.graphQLErrors && e.graphQLErrors.length > 0 && e.graphQLErrors.some(error => error.message === 'jwt expired' || error.message === 'invalid signature')){
        //     info({ message: 'Token expired' })
        //     apolloTokenExpiredHandler.handle()
        //   } else {
        //     error({ message: errorStringFromResponse(e) })
        //   }
        // }),
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

export const GET_RESOURCE = gql`query GetResource($id: Int!) {
  resourceById(id: $id) {
    accountByAccountId {
      email
      id
      name
      willingToContribute
      imageByAvatarImageId {
        publicId
      }
    }
    canBeDelivered
    canBeExchanged
    canBeGifted
    canBeTakenAway
    description
    id
    isProduct
    isService
    expiration
    title
    resourcesResourceCategoriesByResourceId {
      nodes {
        resourceCategoryCode
      }
    }
    resourcesImagesByResourceId {
      nodes {
        imageByImageId {
          publicId
        }
      }
    }
    locationBySpecificLocationId {
      address
      latitude
      longitude
      id
    }
    suspended
    paidUntil
    created
    deleted
    subjectiveValue
  }
}`