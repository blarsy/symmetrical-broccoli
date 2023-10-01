import React, { useContext, useEffect, useState } from "react"
import { fromData, fromError, initial } from "@/lib/DataLoadState"
import { Network } from "@/lib/schema"
import { getNetwork } from "@/lib/api"
import { AppContext } from "@/components/AppContextProvider"
import { t } from "@/i18n"
import { ActivityIndicator, List, Snackbar } from "react-native-paper"
import { View } from "react-native"
import Images from "@/Images"
import { RouteProps } from "@/lib/utils"

const MyNetwork = ({ route, navigation }: RouteProps) => {
    const appContext = useContext(AppContext)
    const [network, setNetwork] = useState(initial<Network>(true))

    const loadNetwork = async () => {
        try {
            const res = await getNetwork(appContext.state.token.data!)
            setNetwork(fromData(res))
        } catch(e) {
            setNetwork(fromError(e, t('requestError')))
        }
    }

    useEffect(() => {
        loadNetwork()
    }, [route.params && route.params.hasChanged])
    
    if( network.error && network.error.message ) {
        return <Snackbar visible={!!network.error && !!network.error.message} onDismiss={() => setNetwork(initial<Network>(false))}>{network.error.message}</Snackbar>
    } else if(network.loading){
        return <ActivityIndicator style={{ marginTop: 10 }} />
    } else {
        return <View style={{ flexDirection: 'column' }}>
            <List.Item title={t('myNetwork_title')} left={() => <Images.Heart style={{ margin: 10 }} width={30} height={30} />} 
                right={() => <List.Icon icon="chevron-right" />} onPress={() => navigation.navigate('connections', { network })} />
            <List.Item title={t('requestsReceived_title')} left={() => <Images.Received style={{ margin: 10 }} width={30} height={30} />} 
                right={() => <List.Icon icon="chevron-right" />}  onPress={() => navigation.navigate('requestsReceived', { network })} />
            <List.Item title={t('requestsSent_title')} left={() => <Images.Sent style={{ margin: 10 }} width={30} height={30} />} 
                right={() => <List.Icon icon="chevron-right" />}  onPress={() => navigation.navigate('requestsSent', { network })} />
        </View>    
    }
}

export default MyNetwork