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
import {List } from "react-native-paper"
import { Image, View } from "react-native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import AddFriend from "./AddFriend"
import { NavigationHelpers, ParamListBase } from "@react-navigation/native"
import { lightPrimaryColor } from "./layout/constants"

interface SubViewProps {
    id: number,
    titleI18n: string,
    children: JSX.Element,
    imgSrc: any
}

const SubViewAccordion = ({ id, titleI18n, children, imgSrc }: SubViewProps) => <List.Accordion id={id} title={<Text style={{ textTransform: 'uppercase' }}>{t(titleI18n)}</Text>} 
    titleStyle={{ fontFamily: 'DK-magical-brush', fontSize: 20, borderBottomWidth: 1 }}  titleNumberOfLines={2}
    right={({ isExpanded}) => isExpanded ?
        <Image source={require('/assets/FLECHE.svg')} style={{ width: 25, height: 25, tintColor: '#000', 
            transform: [{ rotate: '270deg' }] }}/> :
        <Image source={require('/assets/FLECHE.svg')} style={{ width: 25, height: 25, tintColor: '#000', 
            transform: [{ rotate: '90deg' }] }}/>}
    left={({color, style}) => <Image source={imgSrc} style={{ ...style, width: 30, height: 30, tintColor: '#000'}} /> }>
        <View style={{ flex: 1, padding: 10 }}>{children}</View>
</List.Accordion>

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
        return <List.AccordionGroup>
            <SubViewAccordion id={1} titleI18n="myNetwork_title" imgSrc={require('/assets/HEART.svg')}>
                <Connections state={network} onAddRequested={() => navigation.navigate('addFriend')} onChange={loadNetwork}/>
            </SubViewAccordion>
            <SubViewAccordion id={2} titleI18n="requestsReceived_title" imgSrc={require('/assets/RECU.svg')}>
                <RequestsReceived state={network} onChange={loadNetwork}/>
            </SubViewAccordion>
            <SubViewAccordion id={3} titleI18n="requestsSent_title" imgSrc={require('/assets/ENVOYE.svg')}>
                <RequestsSent state={network} onChange={loadNetwork}/>
            </SubViewAccordion>
        </List.AccordionGroup>
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
        <StackNav.Screen name="networkMain" component={NetworkMainView} initialParams={{ timestamp: new Date() }} key="networkMain" />
        <StackNav.Screen name="addFriend" component={AddFriend} key="addFriend" />
    </StackNav.Navigator>
}

export default MyNetwork