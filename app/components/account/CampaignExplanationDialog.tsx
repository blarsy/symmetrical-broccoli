import React, { useState } from "react"
import { Dimensions, StyleProp, View, ViewStyle } from "react-native"
import { ThemedDialog } from "../ConfirmDialog"
import { AnimatedSwipeHand, Hr, OrangeButton } from "../layout/lib"
import { gql, useMutation } from "@apollo/client"
import { Icon, Text, Tooltip } from "react-native-paper"
import { t } from "@/i18n"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import SwiperFlatList from "react-native-swiper-flatlist"
import dayjs from "dayjs"
import { primaryColor } from "../layout/constants"
import { Campaign } from "@/lib/useActiveCampaign"
import PriceTag, { PriceTagSizeEnum } from "../tokens/PriceTag"

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
                        <View style={childStyle}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'center' }}>
                                <Icon size={30} source="bullhorn"/>
                                <Text variant="headlineLarge">{p.campaign.name}</Text>
                            </View>
                            <Text variant="bodyLarge">{p.campaign.description}</Text>
                            <Hr color="#000" />
                            <Text variant="bodyLarge">{t('createResourcesInCampaignExplanation')}</Text>
                            <Text variant="headlineLarge">{t('rewardsMultiplied', { multiplier: p.campaign.resourceRewardsMultiplier })}</Text>
                            <Text variant="bodyLarge">{t('thatsNotAll')}</Text>
                        </View>
                        <View style={{ ...childStyle, ...{ alignItems: 'center' }}}>
                            <Text variant="headlineLarge">{t('airdropTitle')}</Text>
                            <View style={{ flexDirection: 'row', gap: '8', alignItems: 'center' }}>
                                <PriceTag size={PriceTagSizeEnum.big} value={p.campaign.airdropAmount} label=""/>
                                <Text variant="headlineLarge" style={{ color: primaryColor, fontSize: 30 }}>{t('win')}</Text>
                            </View>
                            <Text variant="bodyLarge">{t('create2ResourcesOnCampaign')}</Text>
                            <Text variant="bodyLarge" style={{ textAlign: 'center' }}>{dayjs(p.campaign.airdrop).format(t('dateTimeFormat'))}</Text>
                            <Text variant="bodyLarge">{t('ensureAirdropEligibility')}</Text>
                        </View>
                        <View style={childStyle}>
                            <Text variant="headlineLarge" style={{ alignSelf: 'center' }}>{t('campaignSummaryTitle')}</Text>
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