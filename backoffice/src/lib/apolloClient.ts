import { ApolloClient, InMemoryCache, createHttpLink, from } from "@apollo/client"
import getConfig from '@/config/index'

export const getApolloClient = (version?: string) => {
    const config = getConfig(version)
    const httpLink = createHttpLink({ uri: config.graphqlUrl })

    return new ApolloClient({
      link: from([
        httpLink
      ]),
      cache: new InMemoryCache(),
      defaultOptions: {
        watchQuery: {
          fetchPolicy: 'cache-and-network'
        }
      }
    })
  }