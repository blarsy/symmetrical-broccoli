import { Account, Network } from "@/lib/schema"
import React, { useContext, useState } from "react"
import { ActivityIndicator, IconButton, List, Portal, Snackbar, Text } from "react-native-paper"
import { View } from "react-native"
import AppendableList from "./AppendableList"
import DataLoadState from "@/lib/DataLoadState"
import { AppContext } from "./AppContextProvider"
import { t } from "@/i18n"
import { removeFriend } from "@/lib/api"
import Images from "@/Images"

interface Props {
    state: DataLoadState<Network>,
    onAddRequested: () => void,
    onChange: () => Promise<void>
}

interface ConnectionProps {
    item: Account,
    onChange: () => Promise<void>
}

const Connection = ({ item, onChange }: ConnectionProps) => {
    const appContext = useContext(AppContext)
    const [opProcessing, setOpProcessing] = useState(false)
    return <List.Item title={item.name} description={item.email} right={() => <View style={{ flexDirection: 'row' }}>
        { opProcessing && <ActivityIndicator /> }
        <IconButton style={{ width: 24, height: 24 }} iconColor="#000" icon={Images.Cross} size={20} onPress={async () => {
            try {
                setOpProcessing(true)
                await removeFriend(item.id, appContext.state.token.data!)
                appContext.actions.notify(t('friendRemoved_Message', { name: item.name }))
                onChange()
            } catch(e) {
                appContext.actions.notify(t('requestError'))
            } finally {
                setOpProcessing(false)
            }
        }} />
    </View>} />
}

const Connections = ({ state, onAddRequested, onChange }: Props) => <AppendableList
    dataFromState={state => state.data!.linkedAccounts} state={state}
    displayItem={(item, idx) => <Connection key={idx} item={item} onChange={onChange} />} onAddRequested={onAddRequested} />

export default Connections