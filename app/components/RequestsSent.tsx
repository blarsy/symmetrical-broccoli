import { Account, Network } from "@/lib/schema"
import React, { useContext, useState } from "react"
import { ActivityIndicator, IconButton, List } from "react-native-paper"
import { View } from "react-native"
import DataLoadState from "@/lib/DataLoadState"
import LoadedList from "./LoadedList"
import { AppContext } from "./AppContextProvider"
import { cancelInvitation } from "@/lib/api"
import { t } from "@/i18n"
import Images from "@/Images"
import { RouteProps } from "@/lib/utils"

interface ReqProps {
    item: Account,
    onChange: () => void
}

const RequestSent = ({ item, onChange }: ReqProps) => {
    const appContext = useContext(AppContext)
    const [opProcessing, setOpProcessing] = useState(false)
    return <List.Item title={item.name} description={item.email} right={() => <View style={{ flexDirection: 'row' }}>
        { opProcessing && <ActivityIndicator /> }
        <IconButton iconColor="#000" icon={Images.Cross} size={20} onPress={async () => {
            try {
                setOpProcessing(true)
                await cancelInvitation(item.id, appContext.state.token.data!)
                appContext.actions.notify(t('invitationCancelled_Message', { name: item.name }))
                onChange()
            } catch(e) {
                appContext.actions.notify(t('requestError'))
            } finally {
                setOpProcessing(false)
            }
        }} />
    </View>} />
}

const RequestsSent = ({ route, navigation }: RouteProps) => <LoadedList data={(route.params.network as DataLoadState<Network>).data!.linkRequests}
    loading={route.params.network.loading} error={route.params.network.error}
    displayItem={(item, idx) => <RequestSent key={idx} item={item} onChange={() => {
        navigation.navigate({
            name: 'networkMain',
            params: { hasChanged: true },
            merge: true
        })
    }} /> } />

export default RequestsSent