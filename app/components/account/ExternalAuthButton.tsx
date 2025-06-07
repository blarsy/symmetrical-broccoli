import { t } from "@/i18n"
import Images from "@/Images"
import React from "react"
import { GestureResponderEvent, View } from "react-native"
import { Button, Text } from "react-native-paper"

export enum ExternalAuthButtonProvider {
    google = 0,
    apple = 1
}

interface Props {
    onPress: (((event: GestureResponderEvent) => void) & (() => void))
    type: ExternalAuthButtonProvider
}

const iconSize = 25

const ExternalAuthButton = (p: Props) => <Button icon={ip => <View style={{ height: iconSize, width: iconSize }}>
    {p.type === ExternalAuthButtonProvider.apple ? 
        <Images.AppleLogo height={iconSize} width={iconSize} /> : 
        <Images.GoogleLogo height={iconSize} width={iconSize} />}
</View>} textColor="#000" onPress={p.onPress}
    style={{ width: 250, backgroundColor: '#fff', borderRadius: 5 }}>
        <Text variant="bodyMedium">{t(p.type === ExternalAuthButtonProvider.apple ? 'signInApple': 'signInGoogle')}</Text>
</Button>

export default ExternalAuthButton