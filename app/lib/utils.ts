import { NavigationHelpers, ParamListBase } from "@react-navigation/native"
import { Dimensions } from "react-native"
import { Message } from "./schema"
import { ApolloClient, ApolloError, InMemoryCache, createHttpLink, from, gql, split } from "@apollo/client"
import { apiUrl, subscriptionsUrl } from "./settings"
import { setContext } from "@apollo/client/link/context"
import { ErrorResponse, onError } from '@apollo/client/link/error'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { createClient } from 'graphql-ws'
import { getMainDefinition } from "@apollo/client/utilities"
import { getLocales } from "expo-localization"
import { MediaTypeOptions, launchImageLibraryAsync, requestMediaLibraryPermissionsAsync } from "expo-image-picker"
import { ImageResult, manipulateAsync } from "expo-image-manipulator"
import { IAppContext } from "../components/AppContextProvider"


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

export const fontSizeLarge =  aboveMdWidth() ? 24 : 20
export const fontSizeMedium = aboveMdWidth() ? 20 : 16
export const fontSizeSmall = aboveMdWidth() ? 18 : 14

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

export const adaptToWidth = (sm: number, md: number, lg: number):number => {
  switch(getScreenSize()) {
    case ScreenSize.sm: return sm
    case ScreenSize.md: return md
    case ScreenSize.lg: return lg
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

let language: string | undefined = undefined
export const getLanguage = (): string => {
  if(!language) {
      const supportedLanguages = ['fr', 'en']
      const deviceLocales = getLocales()
    
      // find the first supported language that is also installed on the device
      const firstCompatibleLanguage = supportedLanguages.find(supportedLanguage => deviceLocales.some(deviceLocale => deviceLocale.languageCode.toLowerCase() === supportedLanguage))
      
      // If the device is not installed with any comptible language, default to the first supported language
      language = firstCompatibleLanguage || supportedLanguages[0]
  }
  return language
}

export const pickImage = async (success: ((img: ImageResult)=> void), height: number, appContext: IAppContext) => {
  try {
    await requestMediaLibraryPermissionsAsync(true)
    let result = await launchImageLibraryAsync({
        mediaTypes: MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
    })
    
    if(!result.canceled && result.assets.length > 0) {
        const img = await manipulateAsync(result.assets[0].uri, [{ resize: { height }}])

        success(img)
    }
  } catch(e) {
    appContext.actions.setMessage((e as Error).stack!)
    appContext.actions.notify({ error: e as Error})
  }
}             

export const GET_RESOURCE = gql`query GetResource($id: Int!) {
  resourceById(id: $id) {
    accountByAccountId {
      email
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
    created
  }
}`