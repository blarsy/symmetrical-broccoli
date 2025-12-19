import { gql } from "@apollo/client"
import { getApolloClient } from "./apolloClient"
import { useContext } from "react"
import { AppContext, AppDispatchContext, AppReducerActionType } from "@/components/scaffold/AppContextProvider"
import config from "@/config"
import { jwtDecode } from "jwt-decode"
import { AuthProviders } from "./utils"
import { useRouter } from "next/navigation"

export interface AccountInfo {
    name: string
    id: number
    email: string
    avatarPublicId: string
    activated: Date
    amountOfTokens: number
    lastChangeTimestamp: Date
    knowsAboutCampaigns: boolean
}

export const GET_SESSION_DATA = gql`query GetSessionData {
    getSessionDataWeb {
      accountId
      email
      name
      avatarPublicId
      activated
      logLevel
      unreadConversations
      unreadNotifications
      amountOfTokens
    }
  }`

const AUTHENTICATE_EXTERNAL_AUTH = gql`mutation AuthenticateExternalAuth($token: String, $email: String, $authProvider: Int) {
    authenticateExternalAuth(
        input: {email: $email, token: $token, authProvider: $authProvider}
    ) {
        jwtToken
    }
}`

export const REGISTER_ACCOUNT = gql`mutation RegisterAccount($email: String, $name: String, $password: String, $language: String) {
    registerAccount(
        input: {email: $email, name: $name, password: $password, language: $language}
    ) {
        jwtToken
    }
}`

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

export const NOTFICATION_RECEIVED = gql`subscription NotificationSubscription {
  notificationReceived {
    event
    notification {
      data
      id
      created
      read
    }
  }
}`

export const ACCOUNT_CHANGE = gql`subscription AccountChange {
    accountChangeReceived {
      account {
        knowsAboutCampaigns
        name
        language
        email
        imageByAvatarImageId {
            publicId
        }
        amountOfTokens
        activated
        id
      }
    }
}`

const useAccountFunctions = (version: string) => {
    const appDispatch = useContext(AppDispatchContext)
    const appContext = useContext(AppContext)
    const { apiUrl } = config(version)
    const router = useRouter()

    const connectWithToken = async (token: string) => {
        const client = getApolloClient(version, token, disconnect)
        const res = await client.query({ query: GET_SESSION_DATA })

        if(!res.data.getSessionDataWeb) {
            localStorage.removeItem('token')
            appDispatch({ type: AppReducerActionType.Login, payload: { 
                token: '',
                unreadConversations: res.data.getSessionDataWeb.unreadConversations, 
                unreadNotifications: res.data.getSessionDataWeb.unreadNotifications, 
                account: undefined
            }})
        }

        const subscriptions = [
            client.subscribe({ query: ACCOUNT_CHANGE }).subscribe({ next: payload => {
                const updatedAccount: AccountInfo = {
                    activated: payload.data.accountChangeReceived.account.activated,
                    amountOfTokens: payload.data.accountChangeReceived.account.amountOfTokens,
                    lastChangeTimestamp: new Date(),
                    avatarPublicId: payload.data.accountChangeReceived.account.imageByAvatarImageId?.publicId,
                    email: payload.data.accountChangeReceived.account.email,
                    id: payload.data.accountChangeReceived.account.id,
                    name: payload.data.accountChangeReceived.account.name,
                    knowsAboutCampaigns: payload.data.accountChangeReceived.account.knowsAboutCampaigns
                }
                appDispatch({ type: AppReducerActionType.AccountChanged, payload: updatedAccount })
            }}),
            client.subscribe({query: NOTFICATION_RECEIVED }).subscribe({ next: payload => {
                appDispatch({ type: AppReducerActionType.NotificationReceived, payload: payload.data.notificationReceived.notification })
            }})
        ]

        const account: AccountInfo = {
            id: res.data.getSessionDataWeb.accountId, 
            name: res.data.getSessionDataWeb.name, 
            email: res.data.getSessionDataWeb.email, 
            avatarPublicId: res.data.getSessionDataWeb.avatarPublicId,
            activated: res.data.getSessionDataWeb.activated,
            amountOfTokens: res.data.getSessionDataWeb.amountOfTokens,
            lastChangeTimestamp: new Date(),
            knowsAboutCampaigns: res.data.getSessionDataWeb.knowsAboutCampaigns
        }

        localStorage.setItem('token', token)
        appDispatch({ type: AppReducerActionType.Login, payload: {
            token,
            unreadConversations: res.data.getSessionDataWeb.unreadConversations, 
            unreadNotifications: res.data.getSessionDataWeb.unreadNotifications,
            subscriptions,
            account} })
    }

    const disconnect = () => {
        appContext.subscriptions.forEach(s => s.unsubscribe())
        localStorage.removeItem('token')
        appDispatch({ type: AppReducerActionType.Logout, payload: undefined })
        router.push(`/webapp/${version}`)
    }

    const login = async (email: string, password: string) => {
        const client = getApolloClient(version)
        const tokenRes = await client.mutate({ mutation: AUTHENTICATE, variables: { email, password } })
        return connectWithToken(tokenRes.data.authenticate.jwtToken)
    }

    const connectGoogleWithAccessCode = async (code: string, onNewAccountNeeded: (name: string, email: string, gauthToken: string) => void) => {
        return connectWithGoogle({
            code
        }, onNewAccountNeeded)
    }

    const registerViaAuthProvider = async (accountName: string, email: string, language: string, gauthToken: string, authProvider: AuthProviders) => {
        const client = getApolloClient(version)

        const res = await client.mutate({ mutation: REGISTER_ACCOUNT_EXTERNAL_AUTH, variables: { accountName, email, language, token: gauthToken, authProvider } })
        
        return connectWithToken(res.data.registerAccountExternalAuth.jwtToken)
    }

    const completeExternalAuth = async (email: string, idToken: string, authProvider: AuthProviders) => {
        //Important to use the imperative form of Apollo here (no useQuery, useMutation, ...), otherwise some page prerenders fail during the NextJs build, trying to create an Apollo client prematurely
        const client = getApolloClient(version)
        const authenticateRes = await client.mutate({ mutation: AUTHENTICATE_EXTERNAL_AUTH, variables: { email, token: idToken, authProvider } })
        return connectWithToken(authenticateRes.data.authenticateExternalAuth.jwtToken)
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
                return false
            } else {
                throw new Error('Apple user verification failed.')
            }
        } else {
            await completeExternalAuth(decoded.email, id_token!, AuthProviders.apple)
            return true
        }
    }

    const connectWithGoogle = async (gauthBody: any, onNewAccountNeeded: (name: string, email: string, gauthToken: string) => void): Promise<boolean> => {
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
                return false
            } else {
                throw new Error('Google user verification failed.')
            }
        } else {
            const decoded = jwtDecode(responseBody.idToken)
            await completeExternalAuth((decoded as any).email, responseBody.idToken, AuthProviders.google)
            return true
        }
    }

    const registerAccount = async (email: string, password: string, name: string, language: string) => {
        const client = getApolloClient(version)
        const res = await client.mutate({ mutation: REGISTER_ACCOUNT, variables: { email, password, name, language } })
        return connectWithToken(res.data.registerAccount.jwtToken)
    }

    return { login, connectGoogleWithAccessCode, connectApple, completeExternalAuth, connectWithToken, disconnect, 
        registerViaAuthProvider, registerAccount }
}


export default useAccountFunctions