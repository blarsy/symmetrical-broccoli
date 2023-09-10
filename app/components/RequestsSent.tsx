import { Account, Network } from "@/lib/schema"
import React, { useContext, useState } from "react"
import { ActivityIndicator, IconButton, Portal, Snackbar, Text } from "react-native-paper"
import { View } from "react-native"
import DataLoadState, { beginOperation, fromData, fromError, initial } from "@/lib/DataLoadState"
import LoadedList from "./LoadedList"
import { AppContext } from "./AppContextProvider"
import { cancelInvitation } from "@/lib/api"
import { t } from "@/i18n"

interface Props {
    state: DataLoadState<Network>,
    onChange: () => Promise<void>
}

interface ReqProps {
    item: Account,
    isLastRow: boolean,
    onChange: (successMsg: string) => Promise<void>
    onError: (msg: string) => void
}

const RequestSent = ({ item, isLastRow, onChange, onError }: ReqProps) => {
    const appContext = useContext(AppContext)
    const [opProcessing, setOpProcessing] = useState(false)
    return <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', borderBottomColor: '#000', borderRadius: 0.01, borderStyle: 'dashed', borderBottomWidth: isLastRow ? 0 : 1 }}>
        <Text style={{ flex: 1 }}>{item.name}</Text>
        { opProcessing && <ActivityIndicator /> }
        <IconButton iconColor="#000" icon={{ uri: require('/assets/CROSS.svg')}} size={20} onPress={async () => {
            try {
                setOpProcessing(true)
                await cancelInvitation(item.id, appContext.state.token.data!)
                onChange(t('invitationCancelled_Message', { name: item.name }))
            } catch(e) {
                onError(t('requestError'))
            } finally {
                setOpProcessing(false)
            }
        }} />
    </View>
}

const RequestsSent = ({ state, onChange }: Props) => {
    const [message, setMessage] = useState('')
    return <>
        <LoadedList data={state.data!.linkRequests}
            loading={state.loading} error={state.error}
            displayItem={(item, idx) => <RequestSent key={idx} item={item} isLastRow={idx === state.data!.linkRequests.length - 1} onChange={msg => {
                setMessage(msg)
                return onChange()
            }} onError={msg => setMessage(msg)}/>} />
        <Portal>
            <Snackbar visible={!!message} onDismiss={() => setMessage('')}>{message}</Snackbar>
        </Portal>
    </>
}

export default RequestsSent