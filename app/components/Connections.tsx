import { Account, Network } from "@/lib/schema"
import React, { useContext, useState } from "react"
import { ActivityIndicator, IconButton, Portal, Snackbar, Text } from "react-native-paper"
import { View } from "react-native"
import AppendableList from "./AppendableList"
import DataLoadState from "@/lib/DataLoadState"
import { AppContext } from "./AppContextProvider"
import { t } from "@/i18n"
import { removeFriend } from "@/lib/api"

interface Props {
    state: DataLoadState<Network>,
    onAddRequested: () => void,
    onChange: () => Promise<void>
}

interface ConnectionProps {
    item: Account,
    isLastRow: boolean,
    onChange: (successMsg: string) => Promise<void>
    onError: (msg: string) => void
}

const Connection = ({ item, isLastRow, onChange, onError }: ConnectionProps) => {
    const appContext = useContext(AppContext)
    const [opProcessing, setOpProcessing] = useState(false)
    return <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', borderBottomColor: '#000', borderRadius: 0.01, borderStyle: 'dashed', borderBottomWidth: isLastRow ? 0 : 1 }}>
        <Text style={{ flex: 1 }}>{item.name}</Text>
        { opProcessing && <ActivityIndicator /> }
        <IconButton style={{ width: 24, height: 24 }} iconColor="#000" icon={{ uri: require('/assets/CROSS.svg')}} size={20} onPress={async () => {
            try {
                setOpProcessing(true)
                await removeFriend(item.id, appContext.state.token.data!)
                onChange(t('invitationAccepted_Message', { name: item.name }))
            } catch(e) {
                onError(t('requestError'))
            } finally {
                setOpProcessing(false)
            }
        }} />
</View>
}

const Connections = ({ state, onAddRequested, onChange }: Props) => {
    const [message, setMessage] = useState('')
    return <>
        <AppendableList dataFromState={state => state.data!.linkedAccounts} state={state}
            displayItem={(item, idx) => <Connection key={idx} item={item} isLastRow={idx === state.data!.linkedAccounts.length - 1} onChange={msg => {
                setMessage(msg)
                return onChange()
            }} onError={msg => setMessage(msg)} />} onAddRequested={onAddRequested} />
        <Portal>
            <Snackbar visible={!!message} onDismiss={() => setMessage('')}>{message}</Snackbar>
        </Portal>
    </>
}

export default Connections