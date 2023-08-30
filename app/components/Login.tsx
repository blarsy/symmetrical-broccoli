import { useState } from "react"
import { Flex } from 'react-native-flex-layout'
import { AppBar, Stack } from "@react-native-material/core"
import { Text } from "react-native"
import React from "react"
import { t } from 'i18next'
import LoginForm from "./form/LoginForm"
import RegisterForm from "./form/RegisterForm"
import PrimaryColoredContainer from "./layout/PrimaryColoredContainer"
import { primaryColor } from "./layout/constants"

export default function Login () {
    const [registering, setRegistering] = useState(false)
    if(!registering) {
        return <PrimaryColoredContainer>
            <Stack style={{ flex: 1, alignItems: "center", margin: 10, justifyContent: "space-evenly", alignSelf: "stretch" }}>
                <Text style={{ color: '#000', fontWeight: "bold", fontSize: 38, textTransform: "uppercase" }}>{t('login_page_title')}</Text>
                <LoginForm style={{ alignSelf: 'stretch' }} toggleRegistering={() => setRegistering(true) } />
            </Stack>
        </PrimaryColoredContainer>
    } else {
        return <PrimaryColoredContainer>
            <Stack style={{ flex: 1, alignItems: "center", margin: 10, justifyContent: "space-evenly", alignSelf: "stretch" }}>
                <Text style={{ color: '#000', fontWeight: "bold", fontSize: 38, textTransform: "uppercase" }}>{t('register_page_title')}</Text>
                <RegisterForm style={{ alignSelf: 'stretch' }} toggleRegistering={() => setRegistering(false)} />
            </Stack>
        </PrimaryColoredContainer>
    }

}