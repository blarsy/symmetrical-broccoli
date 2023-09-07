import React, { useContext, useEffect, useState } from "react"
import { fromData, fromError, initial } from "@/lib/DataLoadState"
import { Network } from "@/lib/schema"
import { getNetwork } from "@/lib/api"
import { AppContext } from "@/components/AppContextProvider"
import { t } from "i18next"
import { ActivityIndicator, Button, IconButton, Snackbar, Text } from "react-native-paper"
import { Image, TouchableOpacity, View } from "react-native"
import Connections from "./Connections"
import RequestsReceived from "./RequestsReceived"
import RequestsSent from "./RequestsSent"

enum ActiveView {
    Connections = 1,
    RequestsReceived = 2,
    RequestsSent = 3
}

const MyNetwork = () => {
    const appContext = useContext(AppContext)
    const [network, setNetwork] = useState(initial<Network>(true))
    const [currentView, setCurrentView] = useState(undefined as ActiveView | undefined)

    const loadFriends = async () => {
        try {
            const res = await getNetwork(appContext.state.token.data!)
            setNetwork(fromData(res))
        } catch(e) {
            setNetwork(fromError(e, t('requestError')))
        }
    }

    useEffect(() => {
        loadFriends()
    }, [])
    
    if( network.error && network.error.message ) {
        return <Snackbar visible={!!network.error && !!network.error.message} onDismiss={() => setNetwork(initial<Network>(false))}>{network.error.message}</Snackbar>
    } else if(network.loading){
        return <ActivityIndicator />
    } else {
        if(!!currentView) {
            const makeSubview = (component: JSX.Element, title: string) => <View style={{ flex: 1, flexDirection: 'column' }}>
                <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontFamily: 'DK-magical-brush', fontSize: 15, fontWeight: '400', textTransform: 'uppercase' }}>{title}</Text>
                    <Button textColor="#fff" style={{ alignSelf: 'flex-end' }} onPress={() => setCurrentView(undefined)}
                        mode="text" icon="chevron-left"><Text style={{ textTransform: 'uppercase', color: '#fff' }}>{t('back')}</Text></Button>
                </View>
                {component}
            </View>
            switch(currentView!){
                case ActiveView.Connections:
                    return makeSubview(<Connections data={network.data!.linkedAccounts} />, t('myNetwork_title'))
                case ActiveView.RequestsReceived:
                    return makeSubview(<RequestsReceived data={network.data!.receivedLinkRequests}  />, t('requestsReceived_title'))
                case ActiveView.RequestsSent:
                    return makeSubview(<RequestsSent data={network.data!.linkRequests}  />, t('requestsSent_title'))
            }
        } else {
            const makeSubviewButton = (labelI18nCode: string, imgSrc: any, targetSubview: ActiveView) => <TouchableOpacity onPress={() => setCurrentView(targetSubview)}>
                <View style={{flex: 1, alignItems: 'center'}}>
                    <Image source={imgSrc} style={{ width: 30, height: 30, tintColor: '#000'}} />
                    <Text>{t(labelI18nCode)}</Text>
                </View>
            </TouchableOpacity>
            return <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-evenly' }}>
                {[
                    makeSubviewButton('friends_buttonLabel', require('/assets/HEART.svg'), ActiveView.Connections),
                    makeSubviewButton('requestsReceived_buttonLabel', require('/assets/RECU.svg'), ActiveView.RequestsReceived),
                    makeSubviewButton('requestsSent_buttonLabel', require('/assets/ENVOYE.svg'), ActiveView.RequestsSent),
                ]}
            </View>
        }
    }
}

export default MyNetwork