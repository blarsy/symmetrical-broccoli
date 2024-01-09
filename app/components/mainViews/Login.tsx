import { useContext, useState } from "react"
import { View } from "react-native"
import React from "react"
import { t } from 'i18next'
import LoginForm from "@/components/form/LoginForm"
import RegisterForm from "@/components/form/RegisterForm"
import PrimaryColoredContainer from "@/components/layout/PrimaryColoredContainer"
import { Text } from "react-native-paper"
import RecoveryForm from "../form/RecoveryForm"
import { aboveMdWidth, getAuthenticatedApolloClient, mdScreenWidth } from "@/lib/utils"
import { ApolloProvider } from "@apollo/client"
import { AppContext } from "../AppContextProvider"

interface ConnectProps {
    children: JSX.Element,
    titleI18n: string
}

const ConnectContainer = ({ children, titleI18n }: ConnectProps) => {
    const appContext = useContext(AppContext)
    return <ApolloProvider client={getAuthenticatedApolloClient(appContext.state.token)}>
        <PrimaryColoredContainer style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'stretch', margin: 10, 
                alignSelf: 'stretch', gap: 30, maxWidth: aboveMdWidth() ? mdScreenWidth : 'auto' }}>
                <Text variant="titleLarge" style={{ color: '#000', fontWeight: "bold", fontSize: 38, textTransform: "uppercase", textAlign: 'center', lineHeight: 38 }}>{t(titleI18n)}</Text>
                { children }
            </View>
        </PrimaryColoredContainer>
    </ApolloProvider>
} 

export default function Login () {
    const [registering, setRegistering] = useState(false)
    const [recovering, setRecovering] = useState(false)
    if(!registering) {
        if(recovering) {
            return <ConnectContainer titleI18n="recovery_page_title">
                <RecoveryForm toggleRecovering={() => setRecovering(false)} />
            </ConnectContainer>
        }
        return <ConnectContainer titleI18n="login_page_title">
            <LoginForm toggleRegistering={() => setRegistering(true) } toggleRecovering={() => setRecovering(true)} />
        </ConnectContainer>
    } else {
        return <ConnectContainer titleI18n="register_page_title">
            <RegisterForm toggleRegistering={() => setRegistering(false)} />
        </ConnectContainer>
    }

}