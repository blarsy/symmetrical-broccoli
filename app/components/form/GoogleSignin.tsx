import { apiUrl, googleAuthIOSClientID, googleAuthWebClienttId } from "@/lib/settings"
import { GoogleSignin, User } from "@react-native-google-signin/google-signin"
import React, { useEffect, useState } from "react"
import { ErrorSnackbar } from "../OperationFeedback"
import { t } from "@/i18n"
import { useMutation } from "@apollo/client"
import { ActivityIndicator, IconButton, Text } from "react-native-paper"
import DataLoadState, { beginOperation, fromData, fromError, initial } from "@/lib/DataLoadState"
import { View } from "react-native"
import { GraphQlLib } from "@/lib/backendFacade"
import { AuthProviders } from "@/lib/utils"
import ExternalAuthButton, { ExternalAuthButtonProvider } from "../account/ExternalAuthButton"
import { error } from "@/lib/logger"

GoogleSignin.configure({
    webClientId: googleAuthWebClienttId,
    iosClientId: googleAuthIOSClientID
})

interface Props {
    onDone: (jwtToken: string) => void
    onAccountRegistrationRequired: (email: string, token: string) => void
}

export default ({ onDone, onAccountRegistrationRequired }: Props) => {
    const [authStatus, setAuthStatus] = useState<DataLoadState<null>>(initial(false, null))
    const [authenticateExternalAuth] = useMutation(GraphQlLib.mutations.AUTHENTICATE_EXTERNAL_AUTH)
    const [signedInUser, setSignedInUser] = useState<User | null>(null)

    useEffect(() => {
        setSignedInUser(GoogleSignin.getCurrentUser())
    }, [])
    
    return <View style={{ alignItems: 'center' }}>
        <ExternalAuthButton type={ExternalAuthButtonProvider.google} 
            onPress={async () => {
            setAuthStatus(beginOperation())
            try {
                await GoogleSignin.hasPlayServices()
                const res = await GoogleSignin.signIn()
                
                if(res.type === 'success') {
                    //Call backend to verity google account
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
                                try {
                                    onAccountRegistrationRequired(res.data.user.email, res.data.idToken!)
                                } catch(e) {
                                    setAuthStatus(fromError(e as Error))
                                }
                            } else {
                                throw new Error(`Google user verification failed. Code : ${responseBody.error}`)
                            }
                        } else {
                            try {
                                const authenticateRes = await authenticateExternalAuth({ variables: { 
                                    email: res.data.user.email, token: res.data.idToken!, authProvider: AuthProviders.google } })
                                onDone && onDone(authenticateRes.data.authenticateExternalAuth.jwtToken)
                            } catch(e) {
                                setAuthStatus(fromError(e as Error))
                            }
                        }
                        setAuthStatus(fromData(null))
                }
            } catch (e) {
                error({ message: (e as Error).message }, true)
                setAuthStatus(fromError(e as Error))
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
    </View>
}