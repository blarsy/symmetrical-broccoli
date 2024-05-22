import { t } from "@/i18n"
import React from "react"
import { Icon, Surface, Text } from "react-native-paper"
import { lightPrimaryColor } from "./layout/constants"
import { Image, Linking, Platform, View } from 'react-native'
import Container from "./layout/Container"
import { WhiteButton } from "./layout/lib"

export default () => {
    return <Container style={{ flexDirection: 'column' }}>
        <Image source={require('@/assets/img/logo.jpeg')} style={{width: 200, height: 200}} />
        <Surface elevation={5} style={{ alignContent: 'center', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20, backgroundColor: lightPrimaryColor, borderRadius: 10 }}>
            <Icon source="wrench" size={40} />
            <Text variant="titleSmall">{t('must_update_app')}</Text>
            <WhiteButton mode="outlined" onPress={() => {
                switch(Platform.OS) {
                    case 'android':
                    case 'windows':
                    case 'web':
                        Linking.openURL('https://play.google.com/store/apps/details?id=com.topela')
                        break
                    case 'ios':
                    case 'macos':
                        Linking.openURL('https://apps.apple.com/app/tope-la/id6470202780')
                }
            }}>{t('update_button')}</WhiteButton>
        </Surface>
    </Container>
}