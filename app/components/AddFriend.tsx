import { t } from "@/i18n";
import { searchAccount, sendInvitation } from "@/lib/api";
import React, { useContext, useState } from "react";
import { View } from "react-native";
import { ActivityIndicator, IconButton, Snackbar, Text, TextInput } from "react-native-paper";
import { AppContext } from "./AppContextProvider";
import { beginOperation, fromData, fromError, initial } from "@/lib/DataLoadState";
import { Account } from "@/lib/schema";
import LoadedList from "./LoadedList";
import { NavigationHelpers, ParamListBase } from "@react-navigation/native";

const AddFriend = ({ route, navigation }: { route: any, navigation: NavigationHelpers<ParamListBase>}) => {
    const [searchTerm, setSearchTerm] = useState('')
    const [foundAccounts, setFoundAccounts] = useState(initial<Account[]>(false))
    const [addFriendOperationStatus, setAddFriendOperationStatus] = useState(initial<null>(false))
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
        <TextInput label={t('nameOrEmail_label')} placeholder={t('Atleast3chars')}
            onChangeText={async e => {
                setSearchTerm(e)
                searchWithTerm(e)
            }} right={<TextInput.Icon icon="account-search" />} />
        <LoadedList loading={foundAccounts.loading} error={foundAccounts.error} data={foundAccounts.data}
            displayItem={(item, idx) => <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: idx < foundAccounts.data!.length - 1 ? 1 : 0, borderBottomColor: '#000', borderRadius: 0.01, borderStyle: 'dashed' }}>
            <Text style={{ flex: 1 }}>{item.name}</Text>
            { addFriendOperationStatus.loading && <ActivityIndicator /> }
            <IconButton mode="outlined" icon="account-plus" onPress={async () => {
                setAddFriendOperationStatus(beginOperation())
                try {
                    await sendInvitation(item.id, appContext.state.token.data!)
                    //search again, should show the same results, but without the account we just invited
                    await searchWithTerm(searchTerm)
                    setAddFriendOperationStatus(fromData(null))
                    navigation.navigate('networkMain', { timestamp: new Date() })
                } catch(e) {
                    setAddFriendOperationStatus(fromError(e, t('requestError')))
                }
            }} />
        </View>} />
        <Snackbar visible={!!addFriendOperationStatus.error} onDismiss={() => setAddFriendOperationStatus(initial<null>(false))}>
            {t('requestError')}
        </Snackbar>
    </View>
}

export default AddFriend