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

interface Props {
    state: DataLoadState<Network>,
    onChange: () => Promise<void>
}

interface ReqProps {
    item: Account,
    onChange: () => Promise<void>
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

const RequestsSent = ({ state, onChange }: Props) => <LoadedList data={state.data!.linkRequests}
    loading={state.loading} error={state.error}
    displayItem={(item, idx) => <RequestSent key={idx} item={item} onChange={onChange} /> } />

export default RequestsSent