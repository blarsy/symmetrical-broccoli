import Images from "@/Images"
import dayjs from "dayjs"
import { t } from "i18next"
import React, { useContext } from "react"
import { GestureResponderEvent, TouchableOpacity, View } from "react-native"
import { IconButton, Text } from "react-native-paper"
import { AppContext } from "../AppContextProvider"
import { lightPrimaryColor, primaryColor } from "../layout/constants"
import MainResourceImage from "./MainResourceImage"
import { Resource } from "@/lib/schema"
import { IMAGE_BORDER_RADIUS } from "@/lib/images"

interface ResourceCartProps {
    onPress: ((event: GestureResponderEvent) => void) | undefined,
    resource: Resource
    onChatOpen: (resource: Resource) => void
    testID: string
}

export default ({ onPress, resource, onChatOpen, testID }: ResourceCartProps) => {
    const appContext = useContext(AppContext)
    return <TouchableOpacity style={{ display: 'flex', alignItems: 'center', flexDirection: 'row', gap: 10, 
        paddingHorizontal: 5, paddingVertical: 5, backgroundColor: lightPrimaryColor, 
        borderRadius: IMAGE_BORDER_RADIUS }} onPress={onPress} testID={`${testID}:ViewResourceButton`}>
        <MainResourceImage resource={resource} />
        <View style={{ display: 'flex', flexDirection: 'column', position: 'relative', flex: 1, marginRight: 2 }}>
            <Text variant="displaySmall" style={{ color: primaryColor, alignSelf: 'flex-end', fontSize: 10 }}>{`${t('published_at')} ${dayjs(resource.created).format(t('dateFormat'))}`}</Text>
            <View style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Text variant="displayLarge" testID={`${testID}:Title`}>{resource.title}</Text>
                <Text variant="displaySmall" style={{ color: primaryColor, fontSize: 10 }}>{`${t('brought_by_label')} ${resource.account?.name}`}</Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    { resource.canBeGifted && <Text variant="bodySmall" style={{ textTransform: 'uppercase', fontSize: 10 }}>{t('canBeGifted_label')}</Text>}
                    { resource.canBeExchanged && <Text variant="bodySmall" style={{ textTransform: 'uppercase', fontSize: 10 }}>{t('canBeExchanged_label')}</Text>}
                </View>
            </View>
            { (!appContext.account || resource.account!.id != appContext.account.id) && <IconButton testID={`${testID}:ChatButton`} style={{ borderRadius: 0, position: 'absolute', bottom: 5, right: 5 }} size={15} icon={Images.Chat}
                onPress={() => onChatOpen(resource)}/> }
        </View>
    </TouchableOpacity>
}