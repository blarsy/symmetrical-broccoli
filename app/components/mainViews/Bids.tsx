import { t } from "@/i18n"
import { RouteProps } from "@/lib/utils"
import React, { useEffect, useState } from "react"
import { View } from "react-native"
import { SegmentedButtons, Text, useTheme } from "react-native-paper"
import { primaryColor } from "../layout/constants"
import SentBids from "../bids/SentBids"
import ReceivedBids from "../bids/ReceivedBids"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import SimpleBackHeader from "../layout/SimpleBackHeader"
import ViewResource from "../resources/ViewResource"
import ViewAccount from "./ViewAccount"

const StackNav = createNativeStackNavigator()

const BidsMain = ({ route, navigation }: RouteProps) => {
    const [offerType, setOfferType] = useState('S')
    const [includeInactive, setIncludeInactive] = useState(false)
    const theme = useTheme()

    useEffect(() => {
        setOfferType((route.params && route.params.initialOfferType) || 'S')
        setIncludeInactive(route.params && route.params.includeInactive)
    }, [route.params.initialOfferType, route.params.includeInactive])

    return <View style={{ marginTop: 6, marginHorizontal: 6, gap: 6 }}>
        <SegmentedButtons theme={theme} value={offerType} onValueChange={setOfferType}
            buttons={[
                { label: t('sentOffersLabel'), value: 'S', checkedColor: primaryColor },
                { label: t('receivedOffersLabel'), value: 'R', checkedColor: primaryColor }
            ]}/>
        { offerType === 'S' ?
            <SentBids navigation={navigation} initialIncludeInactive={includeInactive} />
        :
            <ReceivedBids navigation={navigation} initialIncludeInactive={includeInactive} />
        }
    </View>
}

const Bids = () => <StackNav.Navigator screenOptions={{ contentStyle: { backgroundColor: '#fff' } }}>
      <StackNav.Screen name="bidsList" component={BidsMain} options={{ headerShown: false }} />
      <StackNav.Screen name="viewResource" key="viewResource" options={{ header: SimpleBackHeader }} 
        component={ViewResource} />
      <StackNav.Screen name="viewAccount" key="viewAccount" 
        options={{ headerShown: true, header: SimpleBackHeader }} component={ViewAccount} />
  </StackNav.Navigator>


export default Bids