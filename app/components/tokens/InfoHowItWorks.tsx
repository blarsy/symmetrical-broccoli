import { t } from "@/i18n"
import React, { useState } from "react"
import { WhiteButton } from "../layout/lib"
import { View } from "react-native"
import ContributeDialog from "./ContributeDialog"

const InfoHowItWorks = () => {
    const [explaining, setExplaining] = useState(false)

    return <View style={{ alignItems: 'center' }}>
        <WhiteButton onPress={() => setExplaining(true)}>{t('showMe')}</WhiteButton>
        <ContributeDialog onDismiss={() => setExplaining(false)} visible={explaining} 
            title={t('contributionExplainationDialogTitle')} />
    </View>
}

export default InfoHowItWorks