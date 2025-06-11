import { appleAuth, appleAuthAndroid } from '@invertase/react-native-apple-authentication'
import React, { useState } from 'react'
import { Platform, View } from 'react-native'
import { v4 as uuid } from 'uuid'
import { apiUrl, appleServiceId, appleAuthRedirectUri } from "@/lib/settings"
import DataLoadState, { fromError } from '@/lib/DataLoadState'
import { OrangeBackedErrorText } from '../layout/lib'
import { ActivityIndicator } from 'react-native-paper'
import { t } from '@/i18n'
import { useMutation } from '@apollo/client'
import { GraphQlLib } from '@/lib/backendFacade'
// Polyfill atob for jwt-decode, as it is not available in React Native
import "core-js/stable/atob"
import { jwtDecode } from 'jwt-decode'
import { AuthProviders } from '@/lib/utils'
import ExternalAuthButton, { ExternalAuthButtonProvider } from '../account/ExternalAuthButton'
import { error } from '@/lib/logger'

interface Props {
    onAccountRegistrationRequired: (email: string, idToken: string, suggestedName: string) => void
    onDone: (jwtDone: string) => void
}

const AppleSignin = ({ onAccountRegistrationRequired, onDone }: Props) => {
    const [feedback, setFeedback] = useState<DataLoadState<undefined>>()
    const [authenticateApple] = useMutation(GraphQlLib.mutations.AUTHENTICATE_EXTERNAL_AUTH)

    const authenticateWithApple = async (id_token: string, nonce: string, firstName?: string, lastName?: string) => {
        const checkResponse = await fetch(`${apiUrl}/appleauth`, { 
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id_token,
                nonce
            })
        })

        // decode the email from the jwt token, as Apple will return it only the first time the user logs in to the app
        const decoded = jwtDecode<{ email: string }>(id_token!)

        if(checkResponse.status === 200) {
            const authenticateRes = await authenticateApple({ variables: { email: decoded.email, token: id_token!, authProvider: AuthProviders.apple } })
            onDone && onDone(authenticateRes.data.authenticateExternalAuth.jwtToken)
        } else {
            const responseBody = await checkResponse.json()
            if(responseBody.error === 'NO_ACCOUNT') {
                onAccountRegistrationRequired(decoded.email, id_token!, (firstName && lastName) ? firstName + ' ' + lastName : '')
            } else {
                setFeedback(fromError(new Error('AppleAuthVerificationFailed'), t('requestError')))
            }
        }
    }

    //if(appleAuth.isSupported) {
    return <View style={{ alignItems: 'center' }}>
        <ExternalAuthButton type={ExternalAuthButtonProvider.apple} onPress={async () => {
            try {
                if(Platform.OS === 'ios') {
                    const appleAuthRequestResponse = await appleAuth.performRequest({
                        requestedOperation: appleAuth.Operation.LOGIN,
                        requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
                    })
                    
                    const credentialState = await appleAuth.getCredentialStateForUser(appleAuthRequestResponse.user)

                    let firstName=undefined, lastName=undefined
                    if(appleAuthRequestResponse!.fullName){
                        firstName = appleAuthRequestResponse.fullName.givenName || undefined
                        lastName = appleAuthRequestResponse.fullName.familyName || undefined
                    }

                    if (credentialState === appleAuth.State.AUTHORIZED) {
                        // errors while executing the mutation will be automatically logged to the server, so don't log it explicitely
                        try {
                            await authenticateWithApple(appleAuthRequestResponse.identityToken!, appleAuthRequestResponse.nonce!, 
                               firstName, lastName)
                        } catch(e) {
                            setFeedback(fromError(e, t('requestError')))
                        }
                    }
                } else if(Platform.OS === 'android') {
                    const rawNonce = uuid()
                    const state = uuid()

                    // Initialize the module
                    appleAuthAndroid.configure({
                        // The Service ID you registered with Apple
                        clientId: appleServiceId,

                        // Return URL added to your Apple dev console. We intercept this redirect, but it must still match
                        // the URL you provided to Apple. It can be an empty route on your backend as it's never called.
                        redirectUri: appleAuthRedirectUri,

                        // Scope.ALL (DEFAULT) = 'email name'
                        scope: appleAuthAndroid.Scope.ALL,

                        // ResponseType.ALL (DEFAULT) = 'code id_token';
                        responseType: appleAuthAndroid.ResponseType.ALL,

                        // [OPTIONAL]
                        // A String value used to associate a client session with an ID token and mitigate replay attacks.
                        // This value will be SHA256 hashed by the library before being sent to Apple.
                        // This is required if you intend to use Firebase to sign in with this credential.
                        // Supply the response.id_token and rawNonce to Firebase OAuthProvider
                        nonce: rawNonce,

                        // [OPTIONAL]
                        // Unique state value used to prevent CSRF attacks. A UUID will be generated if nothing is provided.
                        state,
                    })

                    const { id_token, nonce, user } = await appleAuthAndroid.signIn()
                    // errors while executing the mutation will be automatically logged to the server, so don't log it explicitely
                    try {
                        await authenticateWithApple(id_token!, nonce!, user?.name?.firstName, user?.name?.lastName)
                    } catch(e) {
                        setFeedback(fromError(e, t('requestError')))
                    }
                }
            } catch (e) {
                error({ message: (e as Error).message }, true)
                setFeedback(fromError(e, t('requestError')))
            }
        }} />
        { feedback?.loading && <ActivityIndicator /> }
        { feedback?.error && <OrangeBackedErrorText>{feedback.error.message}</OrangeBackedErrorText>}
    </ View>
    //}
}

export default AppleSignin