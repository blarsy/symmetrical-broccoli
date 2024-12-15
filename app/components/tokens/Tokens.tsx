import { AccountInfo } from "@/lib/schema"
import React, { useState } from "react"
import { StyleProp, View, ViewStyle } from "react-native"
import { IconButton, Text } from "react-native-paper"
import BareIconButton from "../layout/BareIconButton"
import { InfoDialog } from "../ConfirmDialog"
import { t } from "@/i18n"
import InfoHowToGet from "./InfoHowToGet"
import { useNavigation } from "@react-navigation/native"
import InfoHowItWorks from "./InfoHowItWorks"

interface Props {
    account: AccountInfo
    style?: StyleProp<ViewStyle>
    testID: string
}

const Tokens = ({ account, style, testID }: Props) => {
    const [tokenInfoShown, setTokenInfoShown] = useState(false)
    const [tokenHowToGetShown, setTokenHowToGetShown] = useState(false)
    const navigation = useNavigation()
    return <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', ...(style as object) }}>
        <Text variant="labelMedium" testID={`${testID}:amount`}>{`${account.amountOfTokens} Tope${account.amountOfTokens > 1 ? 's': ''}`}</Text>
        <BareIconButton style={{ top: -4 }} Image="help" size={20} onPress={() => setTokenInfoShown(true)} />
        <IconButton mode="outlined" size={25} icon="plus" onPress={() => setTokenHowToGetShown(true)} style={{ margin: 2 }}/>
        <InfoDialog onDismiss={() => setTokenInfoShown(false)} title={t('tokenInfoDialogTitle')} visible={tokenInfoShown}
            content={<InfoHowItWorks />}/>
        <InfoDialog onDismiss={() => setTokenHowToGetShown(false)} title={t('tokenHowToGetDialogTitle')} visible={tokenHowToGetShown}
            content={<InfoHowToGet navigation={ navigation } />} buttonCaptionI18n="ok_caption"/>
    </View>
}

export default Tokens