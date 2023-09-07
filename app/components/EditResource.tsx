import React, { useEffect } from "react"
import { t } from '@/i18n'
import { View } from "react-native"
import { OrangeButton } from "@/components/layout/lib"

export default function EditResource () {
    useEffect(() => {
        
    }, [])
    return <View style={{ flex: 1, flexDirection: 'column' }}>
        <OrangeButton onPress={e => {

        }}>{t('create_label')}</OrangeButton>
    </View>
}