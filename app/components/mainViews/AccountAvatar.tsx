import React from "react"
import { urlFromPublicId } from "@/lib/images"
import { initials } from "@/lib/utils"
import { t } from "i18next"
import { Avatar } from "react-native-paper"
import { TouchableOpacity } from "react-native-gesture-handler"

interface AccountAvatarProps {
    account: { id: number, avatarPublicId?: string, name: string, avatarImageUrl?: string }
    size: number
    onPress: (accountId: number) => void
}

export default ({ account, size, onPress }: AccountAvatarProps) => {
    if(account.avatarPublicId) {
        return <TouchableOpacity onPress={() => onPress(account.id)}>
            <Avatar.Image size={size} source={{ uri:urlFromPublicId(account.avatarPublicId!) }} />
        </TouchableOpacity>
    }
    if(account.avatarImageUrl) {
        return <TouchableOpacity onPress={() => onPress(account.id)}>
            <Avatar.Image size={size} source={{ uri: account.avatarImageUrl }} />
        </TouchableOpacity>
    }

    return <TouchableOpacity onPress={() => onPress(account.id)}>
        <Avatar.Text size={size} label={initials(account.name || t('name_account_removed'))} 
            style={{ backgroundColor: '#0D70E0' }} color="#000" />
    </TouchableOpacity>
}