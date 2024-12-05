import { t } from "@/i18n"
import React from "react"
import { Card, Text } from "react-native-paper"
import { lightPrimaryColor } from "../layout/constants"

const InfoHowItWorks = () => <Card style={{ backgroundColor: lightPrimaryColor, margin: 10, padding: 10 }}>
    <Text variant="bodyMedium">{t('tokenExplain_HowItWorks_1')}</Text>
    <Text variant="bodyMedium">{t('tokenExplain_HowItWorks_2')}</Text>
    <Text variant="bodyMedium">{t('tokenExplain_HowItWorks_3')}</Text>
    <Text variant="bodyMedium">{t('tokenExplain_HowItWorks_4')}</Text>
    <Text variant="bodyMedium">{t('tokenExplain_HowItWorks_5')}</Text>
</ Card>

export default InfoHowItWorks