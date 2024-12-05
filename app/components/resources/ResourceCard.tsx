import { t } from "i18next"
import React, { useState } from "react"
import { StyleProp, TouchableOpacity, View, ViewStyle } from "react-native"
import { IconButton, Text } from "react-native-paper"
import { deletedGrayColor, lightPrimaryColor, primaryColor } from "../layout/constants"
import { FlexResourceImage } from "./MainResourceImage"
import { Resource } from "@/lib/schema"
import { aboveMdWidth, hasMinWidth, percentOfWidth } from "@/lib/utils"
import { IMAGE_BORDER_RADIUS } from "@/lib/images"
import BareIconButton from "../layout/BareIconButton"
import { InfoDialog } from "../ConfirmDialog"
import InfoSuspension from "../tokens/InfoSuspension"

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

export default ({ viewRequested, resource, editRequested, deleteRequested, isExample, style, testID}: Props) => {
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
        backgroundColor: resource.deleted ? deletedGrayColor : lightPrimaryColor, padding: 10, 
        justifyContent: 'space-between', gap: 5, opacity: isExample ? 0.7 : 1, ...(style as object)}}>
        <TouchableOpacity testID={`${testID}:ViewButton`} onPress={() => !isExample && viewRequested(resource.id) }>
            <FlexResourceImage resource={resource} />
        </TouchableOpacity>
        <Text variant="titleMedium" numberOfLines={2} style={{ textAlign: 'center' }}>{resource.title}</Text>
        { resource.deleted ? <Text style={{ fontStyle: "italic", textAlign: 'center' }}>{t('deleted')}</Text> : 
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                <IconButton testID={`${testID}:EditButton`} style={{ alignSelf: 'center', margin: 0, padding: 0 }} size={iconButtonsSize} iconColor="#000" icon="pencil-circle-outline" onPress={e => {
                    e.stopPropagation()
                    !isExample && editRequested()
                }} />
                <IconButton style={{ alignSelf: 'center', margin: 0, padding: 0 }} iconColor={primaryColor} size={iconButtonsSize} icon="close-circle-outline" onPress={e => {
                    e.stopPropagation()
                    !isExample && deleteRequested(resource.id)
                }} />
            </View> }
        { isExample && <Text variant="headlineSmall" 
             style={{ position: 'absolute', backgroundColor: primaryColor, color: '#fff', 
                 transform: [{ rotate: '15deg' }], paddingVertical: 5, paddingHorizontal: 30,
                 right: -10, top: 10 }}>{t('example')}</Text>}
        { resource.suspended && <View style={{ position: 'absolute', flexDirection: 'row', 
            transform: [{ rotate: '-10deg' }], right: 0, top: 10,
            backgroundColor: primaryColor, gap: 30,
            paddingVertical: 5, paddingHorizontal: 30 }}>
            <Text variant="headlineSmall" style={{ color: '#fff' }}>{t('suspended')}</Text>
            <BareIconButton color="#fff" Image="help" size={15} onPress={() => setSuspensionExplanation(true)} />
        </View>}
        <InfoDialog onDismiss={() => setSuspensionExplanation(false)} visible={ suspensionExplanation }
            title={t('suspensionExplanationDialogTitle')} buttonCaptionI18n="ok_caption" 
            content={<InfoSuspension />} />
    </View>
}
