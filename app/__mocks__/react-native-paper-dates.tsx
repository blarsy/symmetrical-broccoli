import React from "react"
import 'dayjs/locale/fr'
import { TextInput } from "react-native-paper"
// import { en, fr, registerTranslation } from "react-native-paper-dates"

// registerTranslation('en', en)
// registerTranslation('fr', fr)

export const DatePickerModal = (p: any) => {
    return <TextInput testID={ `${p.testID}:date` }
        value={new Date(p.date).valueOf().toString()}
        onChangeText={e => {
            if(p.visible) {
                p.onConfirm({ date: new Date(Number(e))})
            }
        }} />
}