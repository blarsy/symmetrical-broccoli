import { Fragment, useState } from "react"
import { Flex } from 'react-native-flex-layout'
import { AppBar } from "@react-native-material/core"
import { Text, View } from "react-native"
import React from "react"
import { t } from 'i18next'
import LoginForm from "./form/LoginForm"
import RegisterForm from "./form/RegisterForm"

export default function Login () {
    const [registering, setRegistering] = useState(false)
    if(!registering) {
        return <Fragment>
            <AppBar title={color => <Text style={{ color: color.color, fontSize: 24 }}>{t('login_page_title')}</Text>} />
            <Flex items="stretch" style={{ margin: '1rem', flex: 1, justifyContent: 'center' }}>
                <LoginForm toggleRegistering={() => setRegistering(true) } />
            </Flex>
        </Fragment>
    } else {
        return <Fragment>
            <AppBar title={color => <Text style={{ color: color.color, fontSize: 24 }}>{t('register_page_title')}</Text>} />
            <Flex items="stretch" style={{ margin: '1rem', flex: 1, justifyContent: 'center' }}>
                <RegisterForm toggleRegistering={() => setRegistering(false)} />
            </Flex>
        </Fragment>
    }

}