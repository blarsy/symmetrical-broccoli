import { t } from "i18next"
import React, { useState } from "react"
import { GestureResponderEvent, StyleProp, TouchableOpacity, View, ViewStyle } from "react-native"
import { Text } from "react-native-paper"
import { deletedGrayColor, lightPrimaryColor, primaryColor } from "../layout/constants"
import { FlexResourceImage } from "./MainResourceImage"
import { Resource } from "@/lib/schema"
import { aboveMdWidth, hasMinWidth, percentOfWidth } from "@/lib/utils"
import { IMAGE_BORDER_RADIUS } from "@/lib/images"
import BareIconButton from "../layout/BareIconButton"
import { InfoDialog } from "../ConfirmDialog"
import InfoSuspension from "../tokens/InfoSuspension"
import { useNavigation } from "@react-navigation/native"
import Images from '@/Images'

const TopBar = ({resource, onDeleteRequested}: {resource: Resource, onDeleteRequested : (e: GestureResponderEvent) => void}) => {
    let text: string = ''
    
    if(resource.deleted){
        text = t('deleted')
    } else if(resource.expiration && resource.expiration < new Date()) {
        text = t('expired')
    }

    return <View style={{ flexDirection: 'row' }}>
        <Text style={{ fontStyle: "italic", textAlign: 'center', flex: 1 }}>{text}</Text> 
        {!resource.deleted && <BareIconButton style={{ alignSelf: 'flex-end', margin: 0, marginBottom: 10, padding: 0 }} 
                size={iconButtonsSize * 0.5} color={primaryColor} Image={Images.Cross} onPress={onDeleteRequested} />}
    </View>
}

interface Props {
    viewRequested:  (resourceId: number) => void
    editRequested: () => void
    deleteRequested: (resourceId: number) => void
    resource: Resource
    isExample?: boolean
    style?: StyleProp<ViewStyle>
    testID: string
}

const iconButtonsSize = aboveMdWidth() ? 60 : 40

export default ({ resource, editRequested, deleteRequested, isExample, style, testID}: Props) => {
    const navigation = useNavigation()
    const [suspensionExplanation, setSuspensionExplanation] = useState(false)
    let size: number
    if(aboveMdWidth()) {
        size = percentOfWidth(31)
    } else if(hasMinWidth(900)) {
        size = percentOfWidth(23)
    } else if(hasMinWidth(1200)) {
        size = 400
    } else {
        size = percentOfWidth(44)
    }

    return <View style={{ borderRadius: IMAGE_BORDER_RADIUS, flexBasis: size, 
        backgroundColor: (resource.deleted || (resource.expiration && resource.expiration < new Date())) ? deletedGrayColor : lightPrimaryColor, padding: 10, 
        justifyContent: 'space-between', gap: 5, opacity: isExample ? 0.7 : 1, ...(style as object)}}>
            <TopBar resource={resource} onDeleteRequested={e => {
                    e.stopPropagation()
                    !isExample && deleteRequested(resource.id)
                }} />
        <TouchableOpacity testID={`${testID}:EditButton`} onPress={() => !isExample && editRequested() }>
            <FlexResourceImage resource={resource} />
        </TouchableOpacity>
        <Text variant="titleMedium" numberOfLines={2} style={{ flex: 1, textAlign: 'center' }}>{resource.title}</Text>
        { isExample && <Text variant="headlineSmall" 
             style={{ position: 'absolute', backgroundColor: primaryColor, color: '#fff', 
                 transform: [{ rotate: '15deg' }], paddingVertical: 5, paddingHorizontal: 30,
                 right: -10, top: 10 }}>{t('example')}</Text>}
        { resource.suspended && <View style={{ position: 'absolute', flexDirection: 'row', 
            transform: [{ rotate: '-10deg' }], right: 'auto', top: 70,
            backgroundColor: primaryColor, gap: 30,
            paddingVertical: 5, paddingHorizontal: 30 }}>
            <Text variant="headlineSmall" style={{ color: '#fff' }}>{t('suspended')}</Text>
            <BareIconButton color="#fff" Image="help" size={15} onPress={() => setSuspensionExplanation(true)} />
        </View>}
        <InfoDialog onDismiss={() => setSuspensionExplanation(false)} visible={ suspensionExplanation }
            title={t('suspensionExplanationDialogTitle')} buttonCaptionI18n="ok_caption" 
            content={<InfoSuspension navigation={navigation} />} />
    </View>
}
