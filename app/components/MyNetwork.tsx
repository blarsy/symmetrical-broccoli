import React, { useContext, useEffect, useState } from "react"
import { fromData, fromError, initial } from "@/lib/DataLoadState"
import { Network } from "@/lib/schema"
import { getNetwork } from "@/lib/api"
import { AppContext } from "@/components/AppContextProvider"
import { t } from "@/i18n"
import { ActivityIndicator, Appbar, List, Portal, Snackbar } from "react-native-paper"
import Connections from "./Connections"
import RequestsReceived from "./RequestsReceived"
import RequestsSent from "./RequestsSent"
import { View } from "react-native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import AddFriend from "./AddFriend"
import { NavigationHelpers, ParamListBase } from "@react-navigation/native"
import { lightPrimaryColor } from "./layout/constants"
import Images from "@/Images"

const NetworkMainView = ({ route, navigation }: { route: any, navigation: NavigationHelpers<ParamListBase>}) => <View style={{ flexDirection: 'column' }}>
    <List.Item title={t('myNetwork_title')} left={() => <Images.Heart style={{ margin: 10 }} width={30} height={30} />} 
        right={() => <List.Icon icon="chevron-right" />} onPress={() => navigation.navigate('connections')} />
    <List.Item title={t('requestsReceived_title')} left={() => <Images.Received style={{ margin: 10 }} width={30} height={30} />} 
        right={() => <List.Icon icon="chevron-right" />}  onPress={() => navigation.navigate('requestsReceived')} />
    <List.Item title={t('requestsSent_title')} left={() => <Images.Sent style={{ margin: 10 }} width={30} height={30} />} 
        right={() => <List.Icon icon="chevron-right" />}  onPress={() => navigation.navigate('requestsSent')} />
</View>


const StackNav = createNativeStackNavigator()

const getViewTitleI18n = (name: string): string => {
    switch(name) {
        case 'addFriend':
            return 'newFriend_viewTitle'
        case 'connections':
            return 'myNetwork_title'
        case 'requestsReceived':
            return 'requestsReceived_title'
        case 'requestsSent':
            return 'requestsSent_title'
        default:
            return ''
    }
}

const MyNetwork = () => {
    const appContext = useContext(AppContext)
    const [network, setNetwork] = useState(initial<Network>(true))
    const [lastChange, setLastChange] = useState('')

    const loadNetwork = async () => {
        try {
            const res = await getNetwork(appContext.state.token.data!)
            setNetwork(fromData(res))
        } catch(e) {
            setNetwork(fromError(e, t('requestError')))
        }
    }

    const notifyChangeAndRefresh = (changeDescription: string) => {
        setLastChange(changeDescription)
        return loadNetwork()
    }

    useEffect(() => {
        loadNetwork()
    }, [])
    
    if( network.error && network.error.message ) {
        return <Snackbar visible={!!network.error && !!network.error.message} onDismiss={() => setNetwork(initial<Network>(false))}>{network.error.message}</Snackbar>
    } else if(network.loading){
        return <ActivityIndicator style={{ marginTop: 10 }} />
    } else {
        return <StackNav.Navigator 
            screenOptions={{ header: props => {
                return props.route.name != 'networkMain' && <Appbar.Header style={{ backgroundColor: lightPrimaryColor }}>
                    <Appbar.BackAction onPress={() => props.navigation.goBack()} />
                    { props.route.params && (props.route.params as { icon: React.ReactNode | undefined }).icon }
                    <Appbar.Content titleStyle={{ fontSize: 20, fontFamily: 'DK-magical-brush', textTransform: 'uppercase' }} title={t(getViewTitleI18n(props.route.name))} />
                </Appbar.Header> }}}>
            <StackNav.Screen name="networkMain" component={NetworkMainView} key="networkMain" />
            <StackNav.Screen initialParams={{ icon: <Images.Heart style={{ margin: 10 }} width={30} height={30} /> }} name="connections" component={(({ route, navigation }: { route: any, navigation: NavigationHelpers<ParamListBase>}) => 
                <Connections state={network} onChange={loadNetwork}
                    onAddRequested={() => navigation.navigate('addFriend')} />)} key="connections" />
            <StackNav.Screen initialParams={{ icon: <Images.Received style={{ margin: 10 }} width={30} height={30} /> }} name="requestsReceived" component={(({ route, navigation }: { route: any, navigation: NavigationHelpers<ParamListBase>}) => 
                <RequestsReceived state={network} onChange={loadNetwork} />)} key="requestsReceived" />
            <StackNav.Screen initialParams={{ icon: <Images.Sent style={{ margin: 10 }} width={30} height={30} /> }} name="requestsSent" component={(({ route, navigation }: { route: any, navigation: NavigationHelpers<ParamListBase>}) => 
                <RequestsSent state={network} onChange={loadNetwork} />)} key="requestsSent" />
            <StackNav.Screen name="addFriend" component={(({ route, navigation }: { route: any, navigation: NavigationHelpers<ParamListBase>}) => 
                <AddFriend onChange={loadNetwork} />)} key="addFriend" />
        </StackNav.Navigator>

    }
}

export default MyNetwork