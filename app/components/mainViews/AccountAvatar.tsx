import React from "react"
import { urlFromPublicId } from "@/lib/images"
import { Account, AccountInfo } from "@/lib/schema"
import { initials } from "@/lib/utils"
import { t } from "i18next"
import { Avatar } from "react-native-paper"
import { TouchableOpacity } from "react-native-gesture-handler"

interface AccountAvatarProps {
    account: AccountInfo | Account
    size: number
    onPress: (accountId: number) => void
}

export default ({ account, size, onPress }: AccountAvatarProps) => {
    if('avatarPublicId' in account) {
        return <TouchableOpacity onPress={() => onPress(account.id)}>
            <Avatar.Image size={size} source={{ uri:urlFromPublicId(account.avatarPublicId!) }} />
        </TouchableOpacity>
    }
    if((account as Account).avatarImageUrl) {
        return <TouchableOpacity onPress={() => onPress(account.id)}>
            <Avatar.Image size={size} source={{ uri: (account as Account).avatarImageUrl }} />
        </TouchableOpacity>
    }

    return <TouchableOpacity onPress={() => onPress(account.id)}>
        <Avatar.Text size={size} label={initials(account.name || t('name_account_removed'))} 
            style={{ backgroundColor: '#0D70E0' }} color="#000" />
    </TouchableOpacity>
}