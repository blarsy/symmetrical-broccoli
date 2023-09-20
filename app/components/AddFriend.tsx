import { t } from "@/i18n"
import { searchAccount, sendInvitation } from "@/lib/api"
import React, { useContext, useState } from "react"
import { View } from "react-native"
import { ActivityIndicator, IconButton, List, Portal, Snackbar, Text, TextInput } from "react-native-paper"
import { AppContext } from "./AppContextProvider"
import { beginOperation, fromData, fromError, initial } from "@/lib/DataLoadState"
import { Account } from "@/lib/schema"
import LoadedList from "./LoadedList"

interface Props {
    onChange: () => Promise<void>
}

interface AccountListItemProps {
    item: Account,
    onChange: (msg: string) => Promise<void>
}

const AccountListItem = ({ item, onChange }: AccountListItemProps) => {
    const appContext = useContext(AppContext)
    const [addFriendOperationStatus, setAddFriendOperationStatus] = useState(false)
    return <List.Item title={item.name} description={item.email} right={() => <View style={{ flexDirection: 'row' }}>
        { addFriendOperationStatus && <ActivityIndicator /> }
        <IconButton mode="outlined" icon="account-plus" onPress={async () => {
            setAddFriendOperationStatus(true)
            try {
                await sendInvitation(item.id, appContext.state.token.data!)
                onChange(t('invitationSent_Message', { name: item.name }))
            } catch(e) {
                onChange(t('requestError'))
            } finally {
                setAddFriendOperationStatus(false)
            }
        }} />
    </View>} />
}

const AddFriend = ({ onChange }: Props) => {
    const [searchTerm, setSearchTerm] = useState('')
    const [foundAccounts, setFoundAccounts] = useState(initial<Account[]>(false))
    const appContext = useContext(AppContext)

    const searchWithTerm = async (term: string) => {
        if(term.length < 3) return
        setFoundAccounts(beginOperation())
        try {
            const found = await searchAccount(term, appContext.state.token.data!)
            setFoundAccounts(fromData(found))
        } catch(e) {
            setFoundAccounts(fromError(e, t('requestError')))
        }
    }

    return <View style={{ flex: 1, padding: 10 }}>
        <TextInput label={t('nameOrEmail_label')} placeholder={t('Atleast3chars')} value={searchTerm}
            onChangeText={async e => {
                setSearchTerm(e)
                searchWithTerm(e)
            }} right={<TextInput.Icon icon="account-search" />} />
        <LoadedList loading={foundAccounts.loading} error={foundAccounts.error} data={foundAccounts.data}
        displayItem={(item, idx) => <AccountListItem key={idx} item={item} onChange={msg => {
            appContext.actions.notify(msg)
            return onChange()
        }} />} />
    </View>
}

export default AddFriend