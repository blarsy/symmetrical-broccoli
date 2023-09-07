import { useState } from "react"
import { View } from "react-native"
import React from "react"
import { t } from 'i18next'
import LoginForm from "@/components/form/LoginForm"
import RegisterForm from "@/components/form/RegisterForm"
import PrimaryColoredContainer from "@/components/layout/PrimaryColoredContainer"
import { Text } from "react-native-paper"

export default function Login () {
    const [registering, setRegistering] = useState(false)
    if(!registering) {
        return <PrimaryColoredContainer>
            <View style={{ flex: 1, flexDirection: 'column', alignItems: "center", margin: 10, justifyContent: "space-evenly", alignSelf: "stretch" }}>
                <Text style={{ color: '#000', fontWeight: "bold", fontSize: 38, textTransform: "uppercase" }}>{t('login_page_title')}</Text>
                <LoginForm style={{ alignSelf: 'stretch' }} toggleRegistering={() => setRegistering(true) } />
            </View>
        </PrimaryColoredContainer>
    } else {
        return <PrimaryColoredContainer>
            <View style={{ flex: 1, flexDirection: 'column', alignItems: "center", margin: 10, justifyContent: "space-evenly", alignSelf: "stretch" }}>
                <Text style={{ color: '#000', fontWeight: "bold", fontSize: 38, textTransform: "uppercase" }}>{t('register_page_title')}</Text>
                <RegisterForm style={{ alignSelf: 'stretch' }} toggleRegistering={() => setRegistering(false)} />
            </View>
        </PrimaryColoredContainer>
    }

}