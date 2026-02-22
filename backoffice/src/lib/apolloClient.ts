import getConfig from '@/config/index'
import { createHttpLink, split, ApolloClient, from, InMemoryCache, gql, ApolloLink } from "@apollo/client"
import { setContext } from "@apollo/client/link/context"
import { getMainDefinition } from "@apollo/client/utilities"
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { createClient } from 'graphql-ws'
import { ErrorResponse, onError } from "@apollo/client/link/error"
import { error } from './logger'

export const getApolloClient = (version: string, token?: string, onSessionExpired? : () => void) => {
    const config = getConfig(version)
    
    const isSsr = typeof window === 'undefined'

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

    const httpLink = createHttpLink({ uri: isSsr ? config.graphqlSsrUrl : config.graphqlUrl, fetch: customFetch || undefined })
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

    const links: ApolloLink[] = [
      onError((e: ErrorResponse) => {
        if(e.graphQLErrors && e.graphQLErrors.length > 0 && e.graphQLErrors.some(error => error.message === 'jwt expired' || error.message === 'invalid signature')){
          onSessionExpired && onSessionExpired()
        }
        try {
          error({
              message: JSON.stringify({ graphQLErrors: e.graphQLErrors, networkError: e.networkError, protocolErrors: e.protocolErrors })
          }, version, true)
        }
        catch {
        }
      }),
      authLink,
    ]
    
    if(!isSsr) {
      const wsLink = new GraphQLWsLink(
        createClient({ 
          url: config.subscriptionsUrl,
          shouldRetry: e => true, 
          retryAttempts: 5, 
          webSocketImpl,
          connectionParams: { authorization: `Bearer ${token}` } })
      )

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

      links.push(wsSplitLink)
    } else {
      links.push(httpLink)
    }
    
    return new ApolloClient({
      link: from(links),
      cache: new InMemoryCache(),
      defaultOptions: {
        watchQuery: {
          fetchPolicy: 'cache-and-network'
        }
      }
    })
}

export const GET_RESOURCE = gql`query GetResource($id: UUID!) {
  resourceById(id: $id) {
    accountsPublicDatumByAccountId {
      id
      name
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
    created
    deleted
    price
    campaignsResourcesByResourceId {
      nodes {
        campaignId
      }
    }
  }
}`

export const GET_ACCOUNT_PUBLIC_INFO = gql`query Account($id: UUID!) {
    getAccountPublicInfo(id: $id) {
      name
      id
      resourcesByAccountId(orderBy: CREATED_DESC) {
        nodes {
          id
          canBeGifted
          canBeExchanged
          title
          description
          deleted
          expiration
          resourcesImagesByResourceId {
            nodes {
              imageByImageId {
                publicId
              }
            }
          }
          resourcesResourceCategoriesByResourceId {
            nodes {
              resourceCategoryCode
            }
          }
          accountsPublicDatumByAccountId {
            id
          }
        }
      }
      imageByAvatarImageId {
        publicId
      }
      accountsLinksByAccountId {
        nodes {
          id
          url
          label
          linkTypeByLinkTypeId {
            id
          }
        }
      }
      locationByLocationId {
        address
        id
        longitude
        latitude
      }
    }
  }`