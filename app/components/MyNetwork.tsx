import React, { useContext, useEffect, useState } from "react"
import { fromData, fromError, initial } from "@/lib/DataLoadState"
import { Network } from "@/lib/schema"
import { getNetwork } from "@/lib/api"
import { AppContext } from "@/components/AppContextProvider"
import { t } from "@/i18n"
import { ActivityIndicator, IconButton, Snackbar, Text } from "react-native-paper"
import Connections from "./Connections"
import RequestsReceived from "./RequestsReceived"
import RequestsSent from "./RequestsSent"
import { TouchableOpacity, View } from "react-native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import AddFriend from "./AddFriend"
import { NavigationHelpers, ParamListBase } from "@react-navigation/native"
import { lightPrimaryColor } from "./layout/constants"
import Images from "@/Images"
import { SvgProps } from "react-native-svg"

interface SubViewProps {
    titleI18n: string,
    children: JSX.Element,
    Img: React.FC<SvgProps>
}

const SubView = ({ titleI18n, children, Img }: SubViewProps) => {
    const [isExpanded, setIsExpanded] = useState(false)
    return <View style={{ flexDirection: "column" }}>
        <TouchableOpacity style={{ borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', padding: 10, alignItems: 'center', gap: 10 }} onPress={() => setIsExpanded(!isExpanded)}>
            <Img width={30} height={30} color="#000" />
            <Text style={{ fontFamily: 'DK-magical-brush', fontSize: 20, textTransform: 'uppercase', flex: 1 }}>{t(titleI18n)}</Text>
            {isExpanded ?
                <View style={{ transform: [{ rotate: '270deg' }] }}><Images.Arrow width={25} height={25} color="#000" /></View> :
                <View style={{ transform: [{ rotate: '90deg' }] }}><Images.Arrow width={25} height={25} color="#000" /></View>}
        </TouchableOpacity>
        { isExpanded && children }
    </View>
}

const NetworkMainView = ({ route, navigation }: { route: any, navigation: NavigationHelpers<ParamListBase>}) => {
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
    }, [route.params.timestamp])
    
    if( network.error && network.error.message ) {
        return <Snackbar visible={!!network.error && !!network.error.message} onDismiss={() => setNetwork(initial<Network>(false))}>{network.error.message}</Snackbar>
    } else if(network.loading){
        return <ActivityIndicator style={{ marginTop: 10 }} />
    } else {
        return <View style={{ flexDirection: 'column' }}>
            <SubView titleI18n="myNetwork_title" Img={Images.Heart}>
                <Connections state={network} onAddRequested={() => navigation.navigate('addFriend')} onChange={loadNetwork}/>
            </SubView>
            <SubView titleI18n="requestsReceived_title" Img={Images.Received}>
                <RequestsReceived state={network} onChange={loadNetwork}/>
            </SubView>
            <SubView titleI18n="requestsSent_title" Img={Images.Sent}>
                <RequestsSent state={network} onChange={loadNetwork}/>
            </SubView>
        </View>
    }
}

const StackNav = createNativeStackNavigator()

const getViewTitleI18n = (name: string): string => {
    switch(name) {
        case 'addFriend':
            return 'newFriend_viewTitle'
        default:
            return ''
    }
}

const MyNetwork = () => {
    return <StackNav.Navigator screenOptions={{ header: props => {
        return props.route.name != 'networkMain' ? <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: lightPrimaryColor }}>
        <IconButton icon="arrow-left" onPress={() => props.navigation.goBack()} />
        <Text style={{ fontSize: 20, fontFamily: 'DK-magical-brush', textTransform: 'uppercase' }}>{t(getViewTitleI18n(props.route.name))}</Text>
    </View> : <></> }}}>
        <StackNav.Screen name="networkMain" component={NetworkMainView} initialParams={{ timestamp: new Date().valueOf() }} key="networkMain" />
        <StackNav.Screen name="addFriend" component={AddFriend} key="addFriend" />
    </StackNav.Navigator>
}

export default MyNetwork