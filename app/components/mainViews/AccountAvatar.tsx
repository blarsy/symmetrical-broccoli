import React from "react"
import { urlFromPublicId } from "@/lib/images"
import { initials } from "@/lib/utils"
import { t } from "i18next"
import { Avatar } from "react-native-paper"
import { TouchableOpacity } from "react-native-gesture-handler"

interface AccountAvatarProps extends AvatarIconProps {
    onPress: (accountId: number) => void
}

interface AvatarIconProps {
    account: { id: number, avatarPublicId?: string, name: string, avatarImageUrl?: string }
    size: number
}

export const AvatarIcon = ({ account, size }: AvatarIconProps) => {
    if(account.avatarImageUrl || account.avatarPublicId) {
        return <Avatar.Image size={size} source={{ uri: account.avatarPublicId ? urlFromPublicId(account.avatarPublicId!) : account.avatarImageUrl }} />
    }
    return <Avatar.Text size={size} label={initials(account.name || t('name_account_removed'))} 
        style={{ backgroundColor: '#0D70E0' }} color="#000" />
}

export default ({ account, size, onPress }: AccountAvatarProps) => {
    return <TouchableOpacity onPress={() => onPress(account.id)}>
        <AvatarIcon account={account} size={size} />
    </TouchableOpacity>
}