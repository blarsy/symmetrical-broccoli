import { gql, useMutation } from "@apollo/client"
import { getApolloClient } from "./apolloClient"
import { useContext } from "react"
import { AppContext, AppDispatchContext, AppReducerActionType } from "@/components/scaffold/AppContextProvider"
import config from "@/config"
import { jwtDecode } from "jwt-decode"

export interface AccountInfo {
    name: string
    id: number
    email: string
    avatarPublicId: string
    activated: Date
    willingToContribute: boolean
    unreadConversations: number[]
    unreadNotifications: number[]
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

export const AUTHENTICATE = gql`mutation Authenticate($email: String, $password: String) {
    authenticate(input: {email: $email, password: $password}) {
        jwtToken
    }
}`

const AUTHENTICATE_GOOGLE = gql`mutation AuthenticateExternalAuth($token: String, $email: String) {
    authenticateExternalAuth(input: {email: $email, token: $token}) {
      jwtToken
    }
}`

const REGISTER_ACCOUNT_EXTERNAL_AUTH = gql`mutation RegisterAccountExternalAuth($accountName: String, $email: String, $language: String, $token: String) {
    registerAccountExternalAuth(
      input: {accountName: $accountName, email: $email, language: $language, token: $token}
    ) {
      jwtToken
    }
  }`

const useAccountFunctions = (version: string) => {
    const appContext = useContext(AppContext)
    const appDispatch = useContext(AppDispatchContext)

    const connectWithToken = async (token: string) => {
        const client = getApolloClient(version, token)
        const res = await client.query({ query: GET_SESSION_DATA })
    
        const account: AccountInfo = {
            id: res.data.getSessionData.accountId, 
            name: res.data.getSessionData.name, 
            email: res.data.getSessionData.email, 
            avatarPublicId: res.data.getSessionData.avatarPublicId,
            activated: res.data.getSessionData.activated,
            unreadConversations: res.data.getSessionData.unreadConversations,
            unreadNotifications: res.data.getSessionData.unreadNotifications,
            willingToContribute: res.data.getSessionData.willingToContribute,
            amountOfTokens: res.data.getSessionData.amountOfTokens,
            unlimitedUntil: res.data.getSessionData.unlimitedUntil || null,
            lastChangeTimestamp: new Date()
        }

        localStorage.setItem('token', token)
        return { res, account, client }
    }

    const disconnect = () => {
        localStorage.removeItem('token')
        appDispatch({ type: AppReducerActionType.Logout, payload: undefined })
    }

    const restoreSession = async (token: string, otherSessionProps: any) => {
        const { account } = await connectWithToken(token)

        appDispatch({ type: AppReducerActionType.Login, payload: { ...otherSessionProps, ...{account, token} } })
    }

    const login = async (email: string, password: string) => {
        const client = getApolloClient(version)
        const tokenRes = await client.mutate({ mutation: AUTHENTICATE, variables: { email, password } })
        const { account } = await connectWithToken(tokenRes.data.authenticate.jwtToken)
        appDispatch({ type: AppReducerActionType.Login, payload: { account } })
    }

    const connectGoogleWithIdToken = async (idToken: string, onNewAccountNeeded: (name: string, email: string, gauthToken: string) => void) => {
        return connectWithGoogle({
            idToken
        }, onNewAccountNeeded)
    }

    const connectGoogleWithAccessCode = async (code: string, onNewAccountNeeded: (name: string, email: string, gauthToken: string) => void) => {
        return connectWithGoogle({
            code
        }, onNewAccountNeeded)
    }

    const registerViaGoogle = async (accountName: string, email: string, language: string, gauthToken: string) => {
        const client = getApolloClient(version)

        const res = await client.mutate({ mutation: REGISTER_ACCOUNT_EXTERNAL_AUTH, variables: { accountName, email, language, token: gauthToken } })
        
        console.log('register return', res.data)
        const { account } = await connectWithToken(res.data.registerAccountExternalAuth.jwtToken)
        appDispatch({ type: AppReducerActionType.Login, payload: { account } })
    }

    const connectWithGoogle = async (gauthBody: any, onNewAccountNeeded: (name: string, email: string, gauthToken: string) => void) => {
        const checkResponse = await fetch(`${config(appContext.version).apiUrl}/gauth`, { 
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
            const client = getApolloClient(version)
            const authenticateRes = await client.mutate({ mutation: AUTHENTICATE_GOOGLE, variables: { email: (decoded as any).email, token: responseBody.idToken } })
            const { account } = await connectWithToken(authenticateRes.data.authenticateExternalAuth.jwtToken)
            appDispatch({ type: AppReducerActionType.Login, payload: { account } })
        }
    }

    return { login, connectGoogleWithIdToken, connectGoogleWithAccessCode, restoreSession, disconnect, registerViaGoogle }
}


export default useAccountFunctions