import { Account, Network } from "@/lib/schema"
import React, { useContext, useState } from "react"
import { ActivityIndicator, IconButton, List } from "react-native-paper"
import { View } from "react-native"
import AppendableList from "./AppendableList"
import DataLoadState from "@/lib/DataLoadState"
import { AppContext } from "./AppContextProvider"
import { t } from "@/i18n"
import { removeFriend } from "@/lib/api"
import Images from "@/Images"
import { RouteProps } from "@/lib/utils"
import ResponsiveListItem from "./ResponsiveListItem"

interface ConnectionProps {
    item: Account,
    onChange: () => void
}

const Connection = ({ item, onChange }: ConnectionProps) => {
    const appContext = useContext(AppContext)
    const [opProcessing, setOpProcessing] = useState(false)
    return <ResponsiveListItem title={item.name} description={item.email} right={() => <View style={{ flexDirection: 'row' }}>
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

const Connections = ({ route, navigation }: RouteProps) => <AppendableList
    dataFromState={state => state.data!.linkedAccounts} state={route.params.network as DataLoadState<Network>}
    displayItem={(item, idx) => <Connection key={idx} item={item} onChange={() => navigation.navigate({
        name: 'networkMain',
        params: { hasChanged: true },
        merge: true
    })} />} onAddRequested={() => navigation.navigate('addFriend')} />

export default Connections