import { t } from "i18next"
import React from "react"
import { StyleProp, TouchableOpacity, View, ViewStyle } from "react-native"
import { IconButton, Text } from "react-native-paper"
import { deletedGrayColor, lightPrimaryColor, primaryColor } from "../layout/constants"
import { FlexResourceImage } from "./MainResourceImage"
import { Resource } from "@/lib/schema"
import { aboveMdWidth, hasMinWidth, percentOfWidth } from "@/lib/utils"
import { IMAGE_BORDER_RADIUS } from "@/lib/images"

interface Props {
    viewRequested:  (resourceId: number) => void
    editRequested: () => void
    deleteRequested: (resourceId: number) => void
    resource: Resource
    isExample?: boolean
    style?: StyleProp<ViewStyle>
}

const iconButtonsSize = aboveMdWidth() ? 60 : 40

export default ({ viewRequested, resource, editRequested, deleteRequested, isExample, style}: Props) => {
    let size: number
    if(aboveMdWidth()) {
        size = percentOfWidth(31)
    } else if(hasMinWidth(900)) {
        size = percentOfWidth(23)
    } else if(hasMinWidth(1200)) {
        size = 400
    } else {
        size = percentOfWidth(45)
    }
    return <View style={{ borderRadius: IMAGE_BORDER_RADIUS, flexBasis: size, 
        backgroundColor: resource.deleted ? deletedGrayColor : lightPrimaryColor, padding: 10, 
        gap: 5, opacity: isExample ? 0.7 : 1, ...(style as object)}}>
        <TouchableOpacity onPress={() => !isExample && viewRequested(resource.id) }>
            <FlexResourceImage resource={resource} />
        </TouchableOpacity>
        <Text variant="titleMedium" numberOfLines={2} style={{ textAlign: 'center' }}>{resource.title}</Text>
        { resource.deleted ? <Text style={{ fontStyle: "italic", textAlign: 'center' }}>{t('deleted')}</Text> : 
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                <IconButton style={{ alignSelf: 'center', margin: 0, padding: 0 }} size={iconButtonsSize} iconColor="#000" icon="pencil-circle-outline" onPress={e => {
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
    </View>
}

// const iconButtonsSize = aboveMdWidth() ? 60 : 40

// export default ({ viewRequested, resource, editRequested, deleteRequested, isExample}: Props) => <ResponsiveListItem onPress={() => viewRequested(resource.id) } title={resource.title} 
//     titleNumberOfLines={1}
//     description={resource.description}
//     style={{ margin: 0, padding: 0, paddingLeft: 5, backgroundColor: resource.deleted ? deletedGrayColor : lightPrimaryColor, borderRadius: IMAGE_BORDER_RADIUS, opacity: isExample ? 0.7 : 1 }}
//     left={() => <SmallResourceImage resource={resource} />}
//     right={() => resource.deleted ? <Text style={{ fontStyle: "italic" }}>{t('deleted')}</Text> : <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
//         <IconButton style={{ alignSelf: 'center', margin: 0 }} size={iconButtonsSize} iconColor="#000" icon="pencil-circle-outline" onPress={e => {
//             e.stopPropagation()
//             editRequested()
//         }} />
//         <IconButton style={{ alignSelf: 'center', margin: 0 }} iconColor={primaryColor} size={iconButtonsSize} icon="close-circle-outline" onPress={e => {
//             e.stopPropagation()
//             deleteRequested(resource.id)
//         }} />
//         { isExample && <Text variant="headlineSmall" 
//             style={{ position: 'absolute', backgroundColor: primaryColor, color: '#fff', 
//                 transform: [{ rotate: '15deg' }], paddingVertical: 5, paddingHorizontal: 30,
//                 right: -10, top: 10 }}>{t('example')}</Text>}
//     </View>}
// />