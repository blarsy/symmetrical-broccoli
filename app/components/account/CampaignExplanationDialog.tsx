import React, { useState } from "react"
import { Dimensions, StyleProp, View, ViewStyle } from "react-native"
import { ThemedDialog } from "../ConfirmDialog"
import { AnimatedSwipeHand, Hr, OrangeButton } from "../layout/lib"
import { gql, useMutation } from "@apollo/client"
import { Icon, Text, Tooltip } from "react-native-paper"
import { t } from "@/i18n"
import { GestureHandlerRootView, ScrollView } from "react-native-gesture-handler"
import SwiperFlatList from "react-native-swiper-flatlist"
import dayjs from "dayjs"
import { primaryColor } from "../layout/constants"
import { Campaign } from "@/lib/useActiveCampaign"
import PriceTag, { PriceTagSizeEnum } from "../tokens/PriceTag"
import Images from "@/Images"

const SET_KNOWS_ABOUT_CAMPAIGNS = gql`mutation SetKnowsAboutCampaigns {
  setAccountKnowsAboutCampaigns(input: {}) {
    integer
  }
}`

interface Props {
    campaign?: Campaign
    onDismiss: () => void
    testID?: string
}

const CampaignExplanationDialog = (p: Props) => {
    const { width: winWidth, height: winHeight } = Dimensions.get('screen')
    const dialogWidth = Math.min(400, winWidth)
    const height = Math.min(winHeight - 120, 700)
    const childWidth = dialogWidth - 48, childPadding = 10, childActualSpace = childWidth - (childPadding * 2)
    const childStyle: StyleProp<ViewStyle> = { width: childWidth, gap: 15, alignItems: 'flex-start' }
    const subViewHeight = height - 80
    const [setKnowsAboutCampaigns] = useMutation(SET_KNOWS_ABOUT_CAMPAIGNS)
    const [swipedToEnd, setSwipedToEnd] = useState(false)

    return <ThemedDialog testID={p.testID} onDismiss={p.onDismiss} visible={!!p.campaign} 
        style={{
            width: dialogWidth, height, marginTop: 0, marginLeft: dialogWidth === winWidth ? 0 : (winWidth - dialogWidth) / 2
        }} contentStyle={{ 
            height: subViewHeight, flex: 1, position: 'relative'
        }}
        content={
            <>
                <GestureHandlerRootView>
                    { p.campaign && <SwiperFlatList onEndReached={async() => {
                        setSwipedToEnd(true)
                        await setKnowsAboutCampaigns()
                    }}>
                        <ScrollView contentContainerStyle={childStyle}>
                            <View style={{ alignItems: 'center', alignSelf: 'stretch', gap: 10 }}>
                                <Text variant="headlineLarge" style={{ fontSize: 30, lineHeight: 30, textTransform: 'uppercase', flex: 1 }}>{p.campaign.name}</Text>
                                <View style={{ width: 120, height: 120, borderRadius: 10 }}>
                                    <Images.Campaign height="100%" width="100%" />
                                </View>
                            </View>
                            <Text variant="bodyLarge">{p.campaign.description}</Text>
                            <Hr color="#000" />
                            <Text variant="bodyLarge">{t('createResourcesInCampaignExplanation')}</Text>
                            <Text variant="headlineLarge">{t('rewardsMultiplied', { multiplier: p.campaign.resourceRewardsMultiplier })}</Text>
                            <Text variant="bodyLarge">{t('thatsNotAll')}</Text>
                        </ScrollView>
                        <View style={{ ...childStyle, ...{ alignItems: 'center' }}}>
                            <View style={{ alignItems: 'center', alignSelf: 'stretch', gap: 10 }}>
                                <Text variant="headlineLarge" style={{ fontSize: 30, lineHeight: 30, textTransform: 'uppercase', flex: 1 }}>{t('airdropTitle')}</Text>
                                <View style={{ width: 120, height: 120, borderRadius: 10 }}>
                                    <Images.Airdrop height="100%" width="100%" />
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', gap: '8', alignItems: 'center' }}>
                                <PriceTag size={PriceTagSizeEnum.big} value={p.campaign.airdropAmount} label=""/>
                                <Text variant="headlineLarge" style={{ color: primaryColor, fontSize: 30, lineHeight: 30 }}>{t('win')}</Text>
                            </View>
                            <Text variant="bodyLarge">{t('create2ResourcesOnCampaign')}</Text>
                            <Text variant="bodyLarge" style={{ textAlign: 'center' }}>{dayjs(p.campaign.airdrop).format(t('dateTimeFormat'))}</Text>
                            <Text variant="bodyLarge">{t('ensureAirdropEligibility')}</Text>
                        </View>
                        <View style={childStyle}>
                            <View style={{ alignItems: 'center', alignSelf: 'stretch', gap: 10 }}>
                                <Text variant="headlineLarge" style={{ fontSize: 30, lineHeight: 30, textTransform: 'uppercase', flex: 1 }}>{t('campaignSummaryTitle')}</Text>
                                <View style={{ width: 120, height: 120, borderRadius: 10 }}>
                                    <Images.MoneyIn height="100%" width="100%" />
                                </View>
                            </View>
                            <Text variant="bodyLarge">{t('campaignAllowYouto')}</Text>
                            <Text variant="bodyLarge">{t('forFree')}</Text>
                            <OrangeButton mode="contained" style={{ alignSelf: 'center' }} onPress={p.onDismiss}>{t('ok_caption')}</OrangeButton>
                        </View>
                    </SwiperFlatList> }
                </GestureHandlerRootView>
                { !swipedToEnd && <AnimatedSwipeHand/> }
            </>
        }/>
}

export default CampaignExplanationDialog