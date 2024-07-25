import { t } from "i18next"
import React from "react"
import { View } from "react-native"
import { IconButton, Text } from "react-native-paper"
import ResponsiveListItem from "../ResponsiveListItem"
import { deletedGrayColor, lightPrimaryColor, primaryColor } from "../layout/constants"
import { SmallResourceImage } from "./MainResourceImage"
import { Resource } from "@/lib/schema"
import { aboveMdWidth } from "@/lib/utils"

interface Props {
    viewRequested:  (resourceId: number) => void
    editRequested: () => void
    deleteRequested: (resourceId: number) => void
    resource: Resource
    isExample: boolean
}

const iconButtonsSize = aboveMdWidth() ? 60 : 40

export default ({ viewRequested, resource, editRequested, deleteRequested, isExample}: Props) => <ResponsiveListItem onPress={() => viewRequested(resource.id) } title={resource.title} 
    titleNumberOfLines={1}
    description={resource.description}
    style={{ margin: 0, padding: 0, paddingLeft: 6, backgroundColor: resource.deleted ? deletedGrayColor : lightPrimaryColor, borderRadius: 10, opacity: isExample ? 0.7 : 1 }}
    left={() => <SmallResourceImage resource={resource} />}
    right={() => resource.deleted ? <Text style={{ fontStyle: "italic" }}>{t('deleted')}</Text> : <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
        <IconButton style={{ alignSelf: 'center', margin: 0 }} size={iconButtonsSize} iconColor="#000" icon="pencil-circle-outline" onPress={e => {
            e.stopPropagation()
            editRequested()
        }} />
        <IconButton style={{ alignSelf: 'center', margin: 0 }} iconColor={primaryColor} size={iconButtonsSize} icon="close-circle-outline" onPress={e => {
            e.stopPropagation()
            deleteRequested(resource.id)
        }} />
        { isExample && <Text variant="headlineSmall" 
            style={{ position: 'absolute', backgroundColor: primaryColor, color: '#fff', 
                transform: [{ rotate: '15deg' }], paddingVertical: 5, paddingHorizontal: 30,
                right: -10, top: 10 }}>{t('example')}</Text>}
    </View>}
/>