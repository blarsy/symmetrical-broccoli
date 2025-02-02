import { apiUrl, googleAuthIOSClientID, googleAuthWebClienttId } from "@/lib/settings"
import { GoogleSignin, GoogleSigninButton, User } from "@react-native-google-signin/google-signin"
import React, { useEffect, useState } from "react"
import { ErrorSnackbar } from "../OperationFeedback"
import { t } from "@/i18n"
import { gql, useMutation } from "@apollo/client"
import { ActivityIndicator, IconButton, Text } from "react-native-paper"
import DataLoadState, { beginOperation, fromData, fromError, initial } from "@/lib/DataLoadState"
import { View } from "react-native"

GoogleSignin.configure({
    webClientId: googleAuthWebClienttId,
    iosClientId: googleAuthIOSClientID
})

const AUTHENTICATE_GOOGLE = gql`mutation AuthenticateExternalAuth($token: String, $email: String) {
    authenticateExternalAuth(input: {email: $email, token: $token}) {
      jwtToken
    }
}`


interface Props {
    onDone: (jwtToken: string) => void
    onAccountRegistrationRequired: (email: string, token: string) => void
}

export default ({ onDone, onAccountRegistrationRequired }: Props) => {
    const [authStatus, setAuthStatus] = useState<DataLoadState<null>>(initial(false, null))
    const [authenticateGoogle] = useMutation(AUTHENTICATE_GOOGLE)
    const [signedInUser, setSignedInUser] = useState<User | null>(null)

    useEffect(() => {
        setSignedInUser(GoogleSignin.getCurrentUser())
    }, [])
    
    return <>
        <GoogleSigninButton style={{ alignSelf: 'center' }} onPress={async () => {
            setAuthStatus(beginOperation())
            try {
                await GoogleSignin.hasPlayServices()
                const res = await GoogleSignin.signIn()
                
                if(res.type === 'success') {
                    //Call backend to verity google account
                    try {
                        const checkResponse = await fetch(`${apiUrl}/gauth`, { 
                            method: 'POST',
                            headers: {
                            Accept: 'application/json',
                            'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                idToken: res.data.idToken
                            })
                        })
                        
                        if(checkResponse.status != 200) {
                            const responseBody = await checkResponse.json()
                            if(responseBody.error === 'NO_ACCOUNT') {
                                onAccountRegistrationRequired(res.data.user.email, res.data.idToken!)
                            } else {
                                throw new Error('Google user verification failed.')
                            }
                        } else {
                            const authenticateRes = await authenticateGoogle({ variables: { email: res.data.user.email, token: res.data.idToken! } })
                            onDone && onDone(authenticateRes.data.authenticateExternalAuth.jwtToken)
                        }
                        setAuthStatus(fromData(null))
                    } catch(fetchError) {
                        setAuthStatus(fromError(fetchError as Error, t('requestError')))
                    }
                }
            } catch (e) {
                setAuthStatus(fromError(e as Error, t('requestError')))
            }
        }} />
        { signedInUser && <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff' }} variant="bodyMedium">{signedInUser.user.email} ?</Text>
            <IconButton mode="contained" containerColor="#fff" iconColor="#000" icon="logout" onPress={() => {
                GoogleSignin.signOut()
                setSignedInUser(null)
            }} />
        </View> }
        { authStatus.loading && <ActivityIndicator color="#FFF" /> }
        { authStatus.error && <ErrorSnackbar onDismissError={() => setAuthStatus(initial(false, null))} error={authStatus.error} message={t('requestError')} /> }
    </>
}