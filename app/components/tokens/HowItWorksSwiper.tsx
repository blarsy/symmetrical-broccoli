import Images from "@/Images"
import { t } from "i18next"
import React, { useState } from "react"
import { View, ViewStyle, StyleProp, ScrollView } from "react-native"
import SwiperFlatList from "react-native-swiper-flatlist"
import { Text } from "react-native-paper"
import ChickenEgg from '@/assets/img/howitworks/chicken-egg.svg'
import TopeValue from '@/assets/img/howitworks/Tope-value.svg'

import { AnimatedSwipeHand } from "../layout/lib"

const WinToken = () => <View style={{ flexDirection: 'row' }}>
    <Images.Check fill="#4BB543" height={50} width={50} />
    <Images.Tokens  height={50} width={50}/>
</View>

interface Props {
    width: number
    style?: StyleProp<ViewStyle>
}

const HowItWorksSwiper = ({ width, style }: Props) => {
    const childWidth = width, childPadding = 10, childActualSpace = childWidth - (childPadding * 2)
    const childStyle: StyleProp<ViewStyle> = { width: childWidth, gap: 15, padding: childPadding, alignItems: 'flex-start' }
    const [swipedToEnd, setSwipedToEnd] = useState(false)

    return <View style={{ flexDirection: 'row', alignItems: 'center', position: 'relative', ...(style as object) }}>
        <SwiperFlatList onEndReached={() => setSwipedToEnd(true)} >
            <View style={childStyle}>
                <Text variant="headlineLarge">{t('howItWorksStep1Title')}</Text>
                <Text variant="bodyLarge">{t('weNeedToGrow')}</Text>
                <Text variant="bodyLarge">{t('chickenOrEgg')}</Text>
                <View style={{ flexDirection: 'row', paddingTop: 50 }}>
                    <ChickenEgg width="100%" height={childActualSpace / (702 / 400)} />
                </View>
            </View>
            <ScrollView contentContainerStyle={childStyle}>
                <Text variant="headlineLarge">{t('howItWorksStep2Title')}</Text>
                <Text variant="bodyLarge">{t('barterIsCool')}</Text>
                <Text variant="bodyLarge">{t('tokenToTheRescue')}</Text>
                <Text variant="bodyLarge">{t('tokenToTheRescue2')}</Text>
                <View style={{ flexDirection: 'row' }}>
                    <TopeValue width="100%" height={childActualSpace / (502 / 400)} />
                </View>
            </ScrollView>
            <ScrollView contentContainerStyle={ { ...childStyle, ...{ alignItems: 'flex-start' } }}>
                <Text variant="headlineLarge">{t('howItWorksStep4Title')}</Text>
                <Text variant="bodyLarge" style={{ alignSelf: 'center' }}>{t('earnTokens')}</Text>
                <View style={{ display: 'flex', flexDirection: 'row', gap: 20, marginTop: 50, alignItems: 'center' }}>
                    <WinToken />
                    <Text variant="bodyMedium">{t('newResource')}</Text>
                </View>
                <View style={{ display: 'flex', flexDirection: 'row', gap: 20, alignItems: 'center' }}>
                    <WinToken />
                    <Text variant="bodyMedium">{t('nicePic')}</Text>
                </View>
                <View style={{ display: 'flex', flexDirection: 'row', gap: 20, alignItems: 'center' }}>
                    <WinToken />
                    <Text variant="bodyMedium">{t('completeProfile')}</Text>
                </View>
                <View style={{ display: 'flex', flexDirection: 'row', gap: 20, alignItems: 'center' }}>
                    <WinToken />
                    <Text variant="bodyMedium" lineBreakMode="clip" numberOfLines={2}>{t('exchangeResourcesAgainsTokens')}</Text>
                </View>
                <View style={{ display: 'flex', flexDirection: 'row', gap: 20, alignItems: 'center' }}>
                    <WinToken />
                    <Text variant="bodyMedium" lineBreakMode="clip" numberOfLines={2}>{t('takePartInCampaigns')}</Text>
                </View>
                <View style={{ display: 'flex', flexDirection: 'row', gap: 20, alignItems: 'center' }}>
                    <WinToken />
                    <Text variant="bodyMedium">...</Text>
                </View>
            </ScrollView>
        </SwiperFlatList>
        { !swipedToEnd && <AnimatedSwipeHand/> }
    </View>
}

export default HowItWorksSwiper