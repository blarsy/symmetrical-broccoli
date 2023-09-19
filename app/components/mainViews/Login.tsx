import { useState } from "react"
import { View } from "react-native"
import React from "react"
import { t } from 'i18next'
import LoginForm from "@/components/form/LoginForm"
import RegisterForm from "@/components/form/RegisterForm"
import PrimaryColoredContainer from "@/components/layout/PrimaryColoredContainer"
import { Text } from "react-native-paper"
import RecoveryForm from "../form/RecoveryForm"

interface ConnectProps {
    children: JSX.Element,
    titleI18n: string
}

const ConnectContainer = ({ children, titleI18n }: ConnectProps) => <PrimaryColoredContainer>
    <View style={{ flex: 1, flexDirection: 'column', alignItems: "stretch", margin: 10, alignSelf: "stretch", gap: 30 }}>
        <Text style={{ marginTop: 50, color: '#000', fontWeight: "bold", fontSize: 38, textTransform: "uppercase", textAlign: 'center' }}>{t(titleI18n)}</Text>
        { children }
    </View>
</PrimaryColoredContainer>

export default function Login () {
    const [registering, setRegistering] = useState(false)
    const [recovering, setRecovering] = useState(false)
    if(!registering) {
        return <ConnectContainer titleI18n="login_page_title">
            {recovering ? <RecoveryForm toggleRecovering={() => setRecovering(false)} />:
                <LoginForm toggleRegistering={() => setRegistering(true) } toggleRecovering={() => setRecovering(true)} />
            }
        </ConnectContainer>
    } else {
        return <ConnectContainer titleI18n="register_page_title">
            <RegisterForm toggleRegistering={() => setRegistering(false)} />
        </ConnectContainer>
    }

}