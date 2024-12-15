import { t } from "@/i18n"
import React, { useContext } from "react"
import { View } from "react-native"
import { Text } from "react-native-paper"
import { AppContext } from "../AppContextProvider"
import AccordionItem from "../AccordionItem"
import InfoHowItWorks from "./InfoHowItWorks"
import History from "./History"
import InfoHowToGet from "./InfoHowToGet"
import { primaryColor } from "../layout/constants"

const TokenSettings = () => {
    const appContext = useContext(AppContext)

    return <View style={{ backgroundColor: primaryColor }}>
        <Text variant="headlineLarge" style={{ color: '#fff', textAlign: 'center', paddingBottom: 20 }}>{t('token_settings_title')}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 15 }}>
            <Text variant="headlineMedium" style={{ color: '#fff' }}>{t('youHave')}</Text>
            <Text variant="headlineMedium" style={{ color: '#fff' }}>{appContext.account?.amountOfTokens}</Text>
            <Text variant="headlineMedium" style={{ color: '#fff' }}>{t('tokenName')}</Text>
        </View>
        <AccordionItem textColor="#fff" big testID="HowItWorks" title={t('howItWorksAccordionTitle')}>
            <InfoHowItWorks />
        </AccordionItem>
        <AccordionItem style={{ marginBottom: 20 }} textColor="#fff" big testID="History" title={t('tokenHistoryAccordionTitle')}>
            <History />
        </AccordionItem>
        <InfoHowToGet />
    </View>
}

export default TokenSettings