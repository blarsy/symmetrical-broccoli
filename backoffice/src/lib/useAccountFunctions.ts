import { gql, useMutation } from "@apollo/client"
import { getApolloClient } from "./apolloClient"
import { Dispatch, useContext } from "react"
import { AppContext, AppDispatchContext, AppReducerActionType } from "@/components/scaffold/AppContextProvider"
import config from "@/config"
import { jwtDecode } from "jwt-decode"
import { AuthProviders } from "./utils"

export interface AccountInfo {
    name: string
    id: number
    email: string
    avatarPublicId: string
    activated: Date
    willingToContribute: boolean
    amountOfTokens: number
    lastChangeTimestamp: Date
    unlimitedUntil: Date | null
}

export const GET_SESSION_DATA = gql`query GetSessionData {
    getSessionData {
      accountId
      email
      name
      avatarPublicId
      activated
      logLevel
      unreadConversations
      unreadNotifications
      willingToContribute
      amountOfTokens
      unlimitedUntil
    }
  }`

export const MESSAGE_RECEIVED = gql`subscription MessageReceivedSubscription {
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
                    id
                    name
                    imageByAvatarImageId {
                        publicId
                    }
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

const AUTHENTICATE_EXTERNAL_AUTH = gql`mutation AuthenticateExternalAuth($token: String, $email: String, $authProvider: Int) {
    authenticateExternalAuth(
        input: {email: $email, token: $token, authProvider: $authProvider}
    ) {
        jwtToken
    }
}`

export const createMessageHandler = (appDispatch: Dispatch<{
    type: AppReducerActionType;
    payload: any;
}>) => (payload: any) => {
    if(payload.data.messageReceived) {
        console.log('payload', payload)
        appDispatch({ type: AppReducerActionType.SetNewChatMessage, payload: payload.data.messageReceived.message })
    }
}

export const AUTHENTICATE = gql`mutation Authenticate($email: String, $password: String) {
    authenticate(input: {email: $email, password: $password}) {
        jwtToken
    }
}`

const REGISTER_ACCOUNT_EXTERNAL_AUTH = gql`mutation RegisterAccountExternalAuth($accountName: String, $email: String, $language: String, $token: String, $authProvider: Int) {
  registerAccountExternalAuth(
    input: {accountName: $accountName, email: $email, language: $language, token: $token, authProvider: $authProvider}
  ) {
    jwtToken
  }
}`

const useAccountFunctions = (version: string) => {
    const appDispatch = useContext(AppDispatchContext)
    const { apiUrl } = config(version)

    const connectWithToken = async (token: string) => {
        const client = getApolloClient(version, token)
        const res = await client.query({ query: GET_SESSION_DATA })

        if(!res.data.getSessionData) {
            localStorage.removeItem('token')
            return undefined
        }

        const subscriber = client.subscribe({ query: MESSAGE_RECEIVED })
        const subscription = subscriber.subscribe({ next: createMessageHandler(appDispatch) })
    
        const account: AccountInfo = {
            id: res.data.getSessionData.accountId, 
            name: res.data.getSessionData.name, 
            email: res.data.getSessionData.email, 
            avatarPublicId: res.data.getSessionData.avatarPublicId,
            activated: res.data.getSessionData.activated,
            willingToContribute: res.data.getSessionData.willingToContribute,
            amountOfTokens: res.data.getSessionData.amountOfTokens,
            unlimitedUntil: res.data.getSessionData.unlimitedUntil || null,
            lastChangeTimestamp: new Date()
        }

        localStorage.setItem('token', token)
        return { account, subscription, subscriber, unreadConversations: res.data.getSessionData.unreadConversations,
            unreadNotifications: res.data.getSessionData.unreadNotifications }
    }

    const disconnect = () => {
        localStorage.removeItem('token')
        appDispatch({ type: AppReducerActionType.Logout, payload: undefined })
    }

    const restoreSession = async (token: string, otherSessionProps: any) => {
        const res = await connectWithToken(token)
        if(!res) token = ''

        appDispatch({ type: AppReducerActionType.Login, payload: { ...otherSessionProps, 
            unreadConversations: res?.unreadConversations, 
            unreadNotifications: res?.unreadNotifications, 
            ...{account: res?.account, token}, 
            messageSubscription: res?.subscription,
            messageSubscriber: res?.subscriber} })
    }

    const login = async (email: string, password: string) => {
        const client = getApolloClient(version)
        const tokenRes = await client.mutate({ mutation: AUTHENTICATE, variables: { email, password } })
        const res = await connectWithToken(tokenRes.data.authenticate.jwtToken)
        appDispatch({ type: AppReducerActionType.Login, payload: { account: res?.account, 
            messageSubscription: res?.subscription,
            messageSubscriber: res?.subscriber,
            unreadConversations: res?.unreadConversations, 
            unreadNotifications: res?.unreadNotifications } })
    }

    const connectGoogleWithAccessCode = async (code: string, onNewAccountNeeded: (name: string, email: string, gauthToken: string) => void) => {
        return connectWithGoogle({
            code
        }, onNewAccountNeeded)
    }

    const registerViaAuthProvider = async (accountName: string, email: string, language: string, gauthToken: string, authProvider: AuthProviders) => {
        const client = getApolloClient(version)

        const res = await client.mutate({ mutation: REGISTER_ACCOUNT_EXTERNAL_AUTH, variables: { accountName, email, language, token: gauthToken, authProvider } })
        
        const connectRes = await connectWithToken(res.data.registerAccountExternalAuth.jwtToken)
        appDispatch({ type: AppReducerActionType.Login, payload: { account: connectRes?.account, 
            messageSubscription: connectRes?.subscription, 
            unreadConversations: connectRes?.unreadConversations,
            messageSubscriber: connectRes?.subscriber,
            unreadNotifications: connectRes?.unreadNotifications } })
    }

    const connectApple = async (id_token: string, nonce: string, firstName: string, lastName: string, onNewAccountNeeded: (name: string, email: string, token: string) => void) => {
        const checkResponse = await fetch(`${apiUrl}/appleauth`, { 
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id_token,
                full_nonce: nonce
            })
        })

        // decode the email from the jwt token, as Apple will return it only the first time the user logs in to the app
        const decoded = jwtDecode<{ email: string }>(id_token!)

        if(checkResponse.status != 200) {
            const responseBody = await checkResponse.json()
            if(responseBody.error === 'NO_ACCOUNT') {
                onNewAccountNeeded((firstName && lastName) ? firstName + ' ' + lastName : '', decoded.email, id_token!)
            } else {
                throw new Error('Apple user verification failed.')
            }
        } else {
            //Important to use the imperative form of Apollo here (no useQuery, useMutation, ...), otherwise some page prerenders fail during the NextJs build, trying to create an Apollo client prematurely
            const client = getApolloClient(version)
             const authenticateRes = await client.mutate({ mutation: AUTHENTICATE_EXTERNAL_AUTH, variables: { email: decoded.email, token: id_token!, authProvider: AuthProviders.apple } })
            const res = await connectWithToken(authenticateRes.data.authenticateExternalAuth.jwtToken)
            appDispatch({ type: AppReducerActionType.Login, payload: { account: res?.account, 
                messageSubscription: res?.subscription, 
                messageSubscriber: res?.subscriber,
                unreadConversations: res?.unreadConversations, 
                unreadNotifications: res?.unreadNotifications } })
        }
    }

    const connectWithGoogle = async (gauthBody: any, onNewAccountNeeded: (name: string, email: string, gauthToken: string) => void) => {
        const checkResponse = await fetch(`${apiUrl}/gauth`, { 
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(gauthBody)
        })
        const responseBody = await checkResponse.json()

        if(checkResponse.status != 200) {
            if(responseBody.error === 'NO_ACCOUNT') {
                const decoded = jwtDecode(responseBody.idToken) as any
                
                onNewAccountNeeded(decoded.name, decoded.email, responseBody.idToken)
            } else {
                throw new Error('Google user verification failed.')
            }
        } else {
            const decoded = jwtDecode(responseBody.idToken)
            //Important to use the imperative form of Apollo here (no useQuery, useMutation, ...), otherwise some page prerenders fail during the NextJs build, trying to create an Apollo client prematurely
            const client = getApolloClient(version)
            const authenticateRes = await client.mutate({ mutation: AUTHENTICATE_EXTERNAL_AUTH, variables: { email: (decoded as any).email, token: responseBody.idToken, authProvider: AuthProviders.google } })
            const res = await connectWithToken(authenticateRes.data.authenticateExternalAuth.jwtToken)
            appDispatch({ type: AppReducerActionType.Login, payload: { account: res?.account, 
                messageSubscription: res?.subscription, 
                messageSubscriber: res?.subscriber,
                unreadConversations: res?.unreadConversations, 
                unreadNotifications: res?.unreadNotifications } })
        }
    }

    return { login, connectGoogleWithAccessCode, connectApple, restoreSession, disconnect, registerViaAuthProvider }
}


export default useAccountFunctions