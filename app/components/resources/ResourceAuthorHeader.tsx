import { Resource } from "@/lib/schema"
import { AvatarIconAccountInfo } from "../mainViews/AccountAvatar"
import ResourceImageWithCreator from "../ResourceImageWithAuthor"
import { StyleProp, View, ViewStyle } from "react-native"
import React from "react"
import { Icon, Text } from "react-native-paper"
import { primaryColor } from "../layout/constants"
import { fontSizeMedium } from "@/lib/utils"
import dayjs from "dayjs"
import { t } from "@/i18n"
import { TouchableOpacity } from "../layout/lib"

interface ResourceAuthorHeaderProps {
    avatarAccountInfo: AvatarIconAccountInfo
    resource: Resource
    onPress: () => void
    containerStyle?: StyleProp<ViewStyle>
}

const ResourceAuthorHeader = (p: ResourceAuthorHeaderProps) => <View style={{ flexDirection: 'row', ...(p.containerStyle as object) }}>
    <ResourceImageWithCreator authorInfo={p.avatarAccountInfo}
        resource={p.resource} onPress={p.onPress} />
    <TouchableOpacity style={{ flexShrink: 1, flexGrow: 1, flexDirection: 'column', padding: 6 }} onPress={p.onPress}>
        <Text numberOfLines={1} ellipsizeMode="tail" variant="headlineMedium" 
            style={{ color: primaryColor, textTransform: 'uppercase' }}>
            <Icon size={fontSizeMedium} color={primaryColor} source="account-circle" /> {p.avatarAccountInfo.name || t('name_account_removed')}</Text>
        <Text numberOfLines={1} ellipsizeMode="tail" variant="headlineMedium" 
            style={{ textDecorationLine: p.resource.deleted ? 'line-through' : 'none' }}>
                {p.resource.title}</Text>
        { p.resource.deleted && <Text variant="headlineSmall">{t('resource_deleted', { deleted: dayjs(p.resource.deleted).format(t('dateFormat')) })}</Text> }
    </TouchableOpacity>
</View>

export default ResourceAuthorHeader