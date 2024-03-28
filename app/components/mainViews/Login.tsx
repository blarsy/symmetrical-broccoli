import { useContext, useState } from "react"
import { View } from "react-native"
import React from "react"
import { t } from 'i18next'
import LoginForm from "@/components/form/LoginForm"
import RegisterForm from "@/components/form/RegisterForm"
import PrimaryColoredView from "@/components/layout/PrimaryColoredView"
import { Text } from "react-native-paper"
import RecoveryForm from "../form/RecoveryForm"
import { aboveMdWidth, getAuthenticatedApolloClient, mdScreenWidth } from "@/lib/utils"
import { ApolloProvider } from "@apollo/client"
import { AppContext } from "../AppContextProvider"
import { AccountInfo } from "@/lib/schema"

interface ConnectProps {
    children: JSX.Element,
    titleI18n: string,
    infoTextI18n?: string
    infoSubtextI18n? : string
}

interface Props {
    onDone?: (token: string, account: AccountInfo) => Promise<void>
    infoTextI18n?: string,
    infoSubtextI18n?: string
}

const ConnectContainer = ({ children, titleI18n, infoTextI18n, infoSubtextI18n }: ConnectProps) => {
    const appContext = useContext(AppContext)
    return <ApolloProvider client={getAuthenticatedApolloClient(appContext.state.token)}>
        <PrimaryColoredView style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'stretch', margin: 10, 
                alignSelf: 'stretch', gap: 30, maxWidth: aboveMdWidth() ? mdScreenWidth : 'auto' }}>
                <Text variant="titleLarge" style={{ color: '#000', fontSize: 38, textTransform: "uppercase", textAlign: 'center', lineHeight: 38 }}>{t(titleI18n)}</Text>
                { infoTextI18n && <Text style={{ textAlign: 'center' }} variant="bodyLarge">{t(infoTextI18n)}</Text> }
                { infoSubtextI18n && <Text style={{ textAlign: 'center' }} variant="bodySmall">{t(infoSubtextI18n)}</Text>}
                { children }
            </View>
        </PrimaryColoredView>
    </ApolloProvider>
} 

export default function Login ({ onDone, infoTextI18n, infoSubtextI18n }: Props) {
    const [registering, setRegistering] = useState(false)
    const [recovering, setRecovering] = useState(false)
    if(!registering) {
        if(recovering) {
            return <ConnectContainer titleI18n="recovery_page_title">
                <RecoveryForm toggleRecovering={() => setRecovering(false)} />
            </ConnectContainer>
        }
        return <ConnectContainer titleI18n="login_page_title" infoTextI18n={infoTextI18n} infoSubtextI18n={infoSubtextI18n}>
            <LoginForm toggleRegistering={() => setRegistering(true) } toggleRecovering={() => setRecovering(true)} onDone={onDone} />
        </ConnectContainer>
    } else {
        return <ConnectContainer titleI18n="register_page_title">
            <RegisterForm toggleRegistering={() => setRegistering(false)} onAccountRegistered={onDone} />
        </ConnectContainer>
    }

}