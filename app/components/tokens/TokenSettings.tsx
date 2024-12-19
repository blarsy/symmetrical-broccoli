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
import { ScrollView } from "react-native-gesture-handler"

const TokenSettings = () => {
    const appContext = useContext(AppContext)

    return <ScrollView style={{ backgroundColor: primaryColor }}>
        <Text variant="headlineLarge" style={{ color: '#fff', textAlign: 'center', paddingBottom: 20 }}>{t('token_settings_title')}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 15 }}>
            <Text variant="headlineMedium" style={{ color: '#fff' }}>{t('youHave')}</Text>
            <Text variant="headlineMedium" style={{ color: '#fff' }}>{appContext.account?.amountOfTokens}</Text>
            <Text variant="headlineMedium" style={{ color: '#fff' }}>{t('tokenName')}</Text>
        </View>
        <AccordionItem textColor="#fff" big testID="HowItWorks" title={t('howItWorksAccordionTitle')}>
            <InfoHowItWorks />
        </AccordionItem>
        <AccordionItem style={{ marginBottom: 20 }} textColor="#fff" big testID="HistoryAccordion" title={t('tokenHistoryAccordionTitle')}>
            <History />
        </AccordionItem>
        <InfoHowToGet />
    </ScrollView>
}

export default TokenSettings