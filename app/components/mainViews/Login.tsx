import { useState } from "react"
import { View } from "react-native"
import React from "react"
import { t } from 'i18next'
import LoginForm from "@/components/form/LoginForm"
import RegisterForm from "@/components/form/RegisterForm"
import PrimaryColoredView from "@/components/layout/PrimaryColoredView"
import { Text } from "react-native-paper"
import RecoveryForm from "../form/RecoveryForm"
import { aboveMdWidth, mdScreenWidth } from "@/lib/utils"
import RegisterExternalAuthForm from "../form/RegisterExternalAuthForm"

interface ConnectProps {
    children: JSX.Element,
    titleI18n: string,
    infoTextI18n?: string
    infoSubtextI18n? : string
}

interface Props {
    onDone?: () => void
    infoTextI18n?: string,
    infoSubtextI18n?: string
}

const ConnectContainer = ({ children, titleI18n, infoTextI18n, infoSubtextI18n }: ConnectProps) => {
    return <PrimaryColoredView style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'stretch', margin: 10, 
            alignSelf: 'stretch', gap: 30, maxWidth: aboveMdWidth() ? mdScreenWidth : 'auto' }}>
            <Text variant="titleLarge" style={{ color: '#000', fontSize: 38, textTransform: "uppercase", textAlign: 'center', lineHeight: 38 }}>{t(titleI18n)}</Text>
            { infoTextI18n && <Text style={{ textAlign: 'center' }} variant="bodyLarge">{t(infoTextI18n)}</Text> }
            { infoSubtextI18n && <Text style={{ textAlign: 'center' }} variant="bodySmall">{t(infoSubtextI18n)}</Text>}
            { children }
        </View>
    </PrimaryColoredView>
} 

enum CurrentOperationEnum {
    Login,
    Recovery,
    Registration,
    ExternalAuthRegistration
}

export default function Login ({ onDone, infoTextI18n, infoSubtextI18n }: Props) {
    const [currentOp, setCurrentOp] = useState({ stage: CurrentOperationEnum.Login, data: null as null | any})
    switch(currentOp.stage) {
        case CurrentOperationEnum.Login:
            return <ConnectContainer titleI18n="login_page_title" infoTextI18n={infoTextI18n} infoSubtextI18n={infoSubtextI18n}>
                <LoginForm toggleRegistering={() => setCurrentOp({ stage: CurrentOperationEnum.Registration, data: null }) } 
                    toggleRecovering={() => setCurrentOp({ stage: CurrentOperationEnum.Recovery, data: null })}
                    onDone={onDone}
                    onAccountRegistrationRequired={(email, token) => setCurrentOp({ stage: CurrentOperationEnum.ExternalAuthRegistration, data: { email, token } })} />
            </ConnectContainer>
        case CurrentOperationEnum.Recovery:
            return <ConnectContainer titleI18n="recovery_page_title">
                <RecoveryForm toggleRecovering={() => setCurrentOp({ stage: CurrentOperationEnum.Login, data: null })} />
            </ConnectContainer>
        case CurrentOperationEnum.Registration:
            return <ConnectContainer titleI18n="register_page_title">
                <RegisterForm toggleRegistering={() => setCurrentOp({ stage: CurrentOperationEnum.Login, data: null })} 
                onAccountRegistered={onDone} 
                onAccountRegistrationRequired={(email, token) => setCurrentOp({ stage: CurrentOperationEnum.ExternalAuthRegistration, data: { email, token } })}/>
            </ConnectContainer>
        case CurrentOperationEnum.ExternalAuthRegistration:
            return <ConnectContainer titleI18n="register_page_title">
                <RegisterExternalAuthForm email={ currentOp.data.email } token={ currentOp.data.token } 
                onAccountRegistered={onDone} 
                toggleRegisteringExternalAuth={() => setCurrentOp({ stage: CurrentOperationEnum.Login, data: null })} />
            </ConnectContainer>
    }
}