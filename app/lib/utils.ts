import { NavigationHelpers, ParamListBase } from "@react-navigation/native"
import { Dimensions, Platform } from "react-native"
import { Message } from "./schema"
import { ApolloClient, ApolloError, InMemoryCache, createHttpLink, from, split } from "@apollo/client"
import { apiUrl, subscriptionsUrl } from "./settings"
import { setContext } from "@apollo/client/link/context"
import { ErrorResponse, onError } from '@apollo/client/link/error'
import RNLanguageDetector from "@os-team/i18next-react-native-language-detector"
import LanguageDetector from 'i18next-browser-languagedetector'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { createClient } from 'graphql-ws'
import { getMainDefinition } from "@apollo/client/utilities"


export const isValidPassword = (password?: string) => !!password && password.length > 7 && !!password.match(/[A-Z]/) && !!password.match(/[^\w]/)

export interface RouteProps {
    route: any, 
    navigation: NavigationHelpers<ParamListBase>
}

export const mdScreenWidth = 600
export const appBarsTitleFontSize = 32

export const aboveMdWidth = (): Boolean => Dimensions.get("window").width >= mdScreenWidth
export const hasMinWidth = (minWidth: number) => Dimensions.get("window").width >= minWidth
export const percentOfWidth = (percent: number) => Dimensions.get('window').width / 100 * percent

export enum ScreenSize {
    sm,
    md,
    lg
}

export const getScreenSize = (): ScreenSize => {
    if(aboveMdWidth()){
        if(hasMinWidth(900)) {
            return ScreenSize.lg
        }
        return ScreenSize.md
    } else {
        return ScreenSize.sm
    }
}

export interface NewMessageData {
    message: Message
    resourceId: number
}

export interface LoadState {
    data: any
    loading: boolean
    error: ApolloError | undefined
}

export const adaptHeight = (sm: number, md: number, lg: number):number => {
    const screenHeight = Dimensions.get("window").height
    if(screenHeight < 400) return sm
    if(screenHeight < 1000) return md
    return lg
}

export const TOKEN_KEY = 'token'

export const apolloTokenExpiredHandler = {
  handle: () => {
    // It is not the intention that this code executes, it should have been replaced by another function that does more sound things,
    // such as clearing local storage of the stale or invalid token
    console.log('Token expired or invalid')
  }
}

export const getAuthenticatedApolloClient = (token: string) => {
    //const token = await AsyncStorage.getItem(TOKEN_KEY)

    const httpLink = createHttpLink({ uri: apiUrl })
    const wsLink = new GraphQLWsLink(createClient({ url: subscriptionsUrl, connectionParams: { authorization: `Bearer ${token}` } }))
    
    const authLink = setContext(async (_, { headers }) => {
      if(token) {
        // return the headers to the context so httpLink can read them
        return {
          headers: {
            ...headers,
            authorization: `Bearer ${token}`,
          }
        }
      } else {
        return headers
      }
    })

    const splitLink = split(
      ({ query }) => {
        const definition = getMainDefinition(query)
        return (
          definition.kind === 'OperationDefinition' &&
          definition.operation === 'subscription'
        )
      },
      wsLink,
      httpLink,
    )
    
    return new ApolloClient({
      link: from([
        onError((e: ErrorResponse) => {
          if(e.graphQLErrors && e.graphQLErrors.length > 0 && e.graphQLErrors.some(error => error.message === 'jwt expired' || error.message === 'invalid signature')){
            apolloTokenExpiredHandler.handle()
          }
        }),
        authLink,
        splitLink
      ]),
      cache: new InMemoryCache(),
      defaultOptions: {
        watchQuery: {
          fetchPolicy: 'cache-and-network'
        }
      }
    })
  }

export const getLocale = (): string => {
  const rawLocale = Platform.OS === "web" ? new LanguageDetector().detect() : RNLanguageDetector.detect()
  let locale = 'en'
  if (rawLocale && typeof rawLocale != 'string' && rawLocale.length) {
    return locale[0]
  } else {
    return rawLocale as string
  }
}