import { NavigationHelpers, ParamListBase } from "@react-navigation/native"
import { Dimensions } from "react-native"
import { Account, AccountInfo, Message } from "./schema"
import { ApolloClient, ApolloError, ApolloLink, InMemoryCache, NormalizedCacheObject, createHttpLink, from, gql, split } from "@apollo/client"
import { apiUrl, clientVersion, subscriptionsUrl } from "./settings"
import { setContext } from "@apollo/client/link/context"
import { ErrorResponse, onError } from '@apollo/client/link/error'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { createClient } from 'graphql-ws'
import { getMainDefinition } from "@apollo/client/utilities"
import { getLocales } from "expo-localization"
import { MediaTypeOptions, launchImageLibraryAsync, requestMediaLibraryPermissionsAsync } from "expo-image-picker"
import { ImageResult, manipulateAsync } from "expo-image-manipulator"
import { debug, error, info, setOrResetGlobalLogger } from "./logger"
import Constants from 'expo-constants'
import { compareVersions } from "compare-versions"
import Application from 'expo-application'
import { get, remove, set } from "./secureStore"
import { AppReducerActionType, IAppState } from "@/components/AppStateContext"
import { registerForPushNotificationsAsync } from "./pushNotifications"

export const isValidPassword = (password?: string) => !!password && password.length > 7 && !!password.match(/[A-Z]/) && !!password.match(/^[A-Z]/)

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

export const apolloTokenExpiredHandler = {
  handle: () => {
    // It is not the intention that this code executes, it should have been replaced by another function that does more sound things,
    // such as clearing local storage of the stale or invalid token
    console.log('Token expired or invalid')
  }
}

export const errorToString = (e: Error) => `message: ${e.message}, name: ${e.name}, ${e.stack && `, stack: ${e.stack}`}`
const errorsToString = (es: readonly Error[]) => es.map(errorToString).join(', ')

const errorStringFromResponse = (e:ErrorResponse) => {
    const ae = e as ErrorResponse
    return `ApolloError: operation ${ae.operation.operationName} ${JSON.stringify(ae.operation.variables)}
      ${ae.graphQLErrors && ae.graphQLErrors.length > 0 && `, graphQLErrors: ${errorsToString(ae.graphQLErrors)}`}, 
      ${ae.networkError && `, networkError: ${errorToString(ae.networkError)}`}`
}

export const getAuthenticatedApolloClient = (token: string) => {
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
      if (Constants.expoConfig?.extra?.storybookEnabled === "true") {
        return 'fr'
      }

      const supportedLanguages = ['fr', 'en']
      const deviceLocales = getLocales()
    
      // find the first supported language that is also installed on the device
      const firstCompatibleLanguage = supportedLanguages.find(supportedLanguage => deviceLocales.some(deviceLocale => deviceLocale.languageCode?.toLowerCase() === supportedLanguage))
      
      // If the device is not installed with any comptible language, default to the first supported language
      language = firstCompatibleLanguage || supportedLanguages[0]
  }
  return language
}

export const pickImage = async (success: ((img: ImageResult)=> void), height: number) => {
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
    deleted
  }
}`

export const initials = (text: string) => {
  if(text)
      return text.split(' ').map(word => word[0].toLocaleUpperCase()).slice(0, 2).join()

  return ""
}

export const versionChecker = (serverVersion: string) => {
  if(Application?.nativeApplicationVersion || clientVersion)
    return compareVersions(Application?.nativeApplicationVersion || clientVersion, serverVersion) >= 0
  
  return true
}

const TOKEN_KEY = 'token'
export const logout = async (appState: IAppState, appDispatch: React.Dispatch<{ type: AppReducerActionType, payload: any }>) => {
  await remove(TOKEN_KEY)
  appState.chatMessagesSubscription?.unsubscribe()
  appDispatch({ type: AppReducerActionType.Logout, payload: undefined })
  info({ message: 'logged out' })
}

export const encureConnected = (appState: IAppState, appDispatch: React.Dispatch<{ type: AppReducerActionType, payload: any }>, message: string, subMessage: string, onConnected: (token: string, account: Account) => void) :  Promise<boolean> => {
  return new Promise(( resolve, reject ) => {
    if(appState.account) {
        onConnected(appState.token, appState.account)
        resolve(true)
    }

    appDispatch({ type: AppReducerActionType.SetConnectingStatus, payload: { message, subMessage, onConnected: (token: string, account: Account) => {
      onConnected(token, account)
      resolve(true)
    }}})
  })
}

const SYNC_PUSH_TOKEN = gql`mutation SyncPushToken($token: String) {
  syncPushToken(input: {token: $token}) {
    integer
  }
}`

const MESSAGE_RECEIVED = gql`subscription MessageReceivedSubscription {
  messageReceived {
      event
      message {
          id
          text
          created
          received
          imageByImageId {
              publicId
          }
          participantByParticipantId {
              id
              accountByAccountId {
                  name
                  id
              }
              conversationByConversationId {
                  id
                  resourceByResourceId {
                      id
                      title
                  }
              }
          }
      }
  }
}`

const GET_SESSION_DATA = gql`query GetSessionData {
  getSessionData {
    accountId
    email
    name
    avatarPublicId
    activated
    logLevel
  }
}`

const handleLogin = (appState: IAppState, appDispatch: React.Dispatch<{type: AppReducerActionType,payload: any}>, token: string): {authenticatedClient : ApolloClient<NormalizedCacheObject>, subscription:  { unsubscribe: () => void } } => {
  apolloTokenExpiredHandler.handle = async () => { 
      await logout(appState, appDispatch)
  }
  const authenticatedClient = getAuthenticatedApolloClient(token)
  registerForPushNotificationsAsync().then(token => {
      authenticatedClient.mutate({ mutation: SYNC_PUSH_TOKEN, variables: { token } })
  })
  const subscription = authenticatedClient.subscribe({ query: MESSAGE_RECEIVED }).subscribe({ next: payload => {
      debug({ message: `Received in-app chat message notification: ${payload.data.messageReceived.message}` })
      if(appState.messageReceivedHandler) {
        appState.messageReceivedHandler(payload.data.messageReceived.message)
      } else {
          appDispatch({ type: AppReducerActionType.SetNewChatMessage, payload: payload.data.messageReceived.message })
      }
  } })
  
  return { authenticatedClient, subscription }
}

const SPLASH_DELAY = 3000
async function executeWithinMinimumDelay<T>(promise: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
      setTimeout(async () => {
          try {
              const val = await promise
              resolve(val)
          } catch (e) {
              reject(e)
          }
      }, SPLASH_DELAY)
  })
}

export const tryRestoreToken = async (appState: IAppState, appDispatch: React.Dispatch<{type: AppReducerActionType,payload: any}>): Promise<void> => {
  const token = await get(TOKEN_KEY)
  if(token) {
      const { authenticatedClient, subscription} = handleLogin(appState, appDispatch, token)
      
      const getSessionPromise = authenticatedClient.query({ query: GET_SESSION_DATA })

      const sessionRes = await executeWithinMinimumDelay(getSessionPromise)
      appDispatch({ type: AppReducerActionType.CompleteLogin, payload: {token:token, chatMessagesSubscription: subscription, account: {
        id: sessionRes.data.getSessionData.accountId,
        name: sessionRes.data.getSessionData.name, 
        email: sessionRes.data.getSessionData.email, 
        avatarPublicId: sessionRes.data.getSessionData.avatarPublicId,
        activated: sessionRes.data.getSessionData.activated
      }} })

      await setOrResetGlobalLogger(sessionRes.data.getSessionData.logLevel)

      info({ message: `Restored session: ${ JSON.stringify(sessionRes.data.getSessionData) }` })
  } else {
      setTimeout(() => appDispatch({ type: AppReducerActionType.CompleteLogin, payload: { token: '', account: undefined, chatMessagesSubscription: undefined } }), SPLASH_DELAY)
  }
}

export const loginComplete = async (appState: IAppState, appDispatch: React.Dispatch<{type: AppReducerActionType,payload: any}>, token: string): Promise<AccountInfo> => {
  await set(TOKEN_KEY, token)
  
  const { authenticatedClient, subscription } = handleLogin(appState, appDispatch, token)

  const res = await authenticatedClient.query({ query: GET_SESSION_DATA })

  const account = {
    id: res.data.getSessionData.accountId, 
    name: res.data.getSessionData.name, 
    email: res.data.getSessionData.email, 
    avatarPublicId: res.data.getSessionData.avatarPublicId,
    activated: res.data.getSessionData.activated
  }

  appDispatch({ type: AppReducerActionType.CompleteLogin, payload: { token, account, chatMessagesSubscription: subscription } })

  await setOrResetGlobalLogger(res.data.getSessionData.logLevel)

  info({ message: `Logged in with session: ${ JSON.stringify(res.data.getSessionData) }` })

  return account
}

export const ensureConnected = (appState: IAppState, appDispatch: React.Dispatch<{type: AppReducerActionType,payload: any}>, message: string, subMessage: string, onConnected: (token: string, account: Account) => void) => {
  if(appState.account) {
      onConnected(appState.token, appState.account)
  } else {
      appDispatch({ type: AppReducerActionType.SetConnectingStatus, payload: { message, subMessage, onConnected: (token: string, account: Account) => {
        if(token) {
          onConnected(token, account)
        }
    } } })
  }
}