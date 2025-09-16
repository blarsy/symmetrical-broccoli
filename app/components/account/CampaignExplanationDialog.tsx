import React, { useState } from "react"
import { Dimensions, StyleProp, View, ViewStyle } from "react-native"
import { ThemedDialog } from "../ConfirmDialog"
import { AnimatedSwipeHand, Hr, OrangeButton } from "../layout/lib"
import { gql, useMutation } from "@apollo/client"
import { Icon, Text } from "react-native-paper"
import { t } from "@/i18n"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import SwiperFlatList from "react-native-swiper-flatlist"
import dayjs from "dayjs"
import { primaryColor } from "../layout/constants"
import Images from "@/Images"
import { Campaign } from "@/lib/useActiveCampaign"

const SET_KNOWS_ABOUT_CAMPAIGNS = gql`mutation SetKnowsAboutCampaigns {
  setAccountKnowsAboutCampaigns(input: {}) {
    integer
  }
}`

export const PriceTag = ({ value, label }: { value: number, label?: string }) => {
    return <View style={{ flexDirection: 'row', gap: '0.5rem', alignItems: 'center' }}>
        { label && <Text style={{ color: primaryColor }} variant="bodyMedium">{label} </Text> }
        <Text style={{ color: primaryColor }} variant="bodyMedium">{value} </Text>
        <Images.Tokens style={{ width: 30, height: 30 }}/>
    </View>
}

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
    const DottedString = ({ labelI18n }: { labelI18n: string }) => <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon source="circle" size={10}/>
        <Text variant="bodyMedium">{t(labelI18n)}</Text>
    </View>

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
                                <Text variant="bodyLarge">{t('createResourcesInCampaignExplanation', { multiplier: p.campaign.resourceRewardsMultiplier })}</Text>
                                <Text variant="bodyLarge">{t('thatsNotAll')}</Text>
                            </View>
                            <View style={{ ...childStyle, ...{ alignItems: 'center' }}}>
                                <Text variant="headlineLarge">{t('airdropTitle')}</Text>
                                <Text variant="bodyMedium">{t('create2ResourcesOnCampaign')}</Text>
                                <Text variant="bodyLarge" style={{ textAlign: 'center' }}>{dayjs(p.campaign.airdrop).format(t('dateTimeFormat'))}</Text>
                                <Text variant="bodyMedium">{t('youReceive')}</Text>
                                <PriceTag value={p.campaign.airdropAmount} label=""/>
                                <Text variant="bodyMedium">{t('ensureAirdropEligibility')}</Text>
                            </View>
                            <View style={childStyle}>
                                <Text variant="headlineLarge" style={{ alignSelf: 'center' }}>{t('campaignSummaryTitle')}</Text>
                                <Text variant="bodyMedium">{t('campaignAllowYouto')}</Text>
                                <DottedString labelI18n="getPlentyOfTokens" />
                                <DottedString labelI18n="seeManyResources" />
                                <DottedString labelI18n="atTheRightMoment" />
                                <DottedString labelI18n="forFree" />
                                <OrangeButton mode="contained" style={{ alignSelf: 'center' }} onPress={p.onDismiss}>{t('ok_caption')}</OrangeButton>
                            </View>
                        </SwiperFlatList> }
                </GestureHandlerRootView>
                { !swipedToEnd && <AnimatedSwipeHand/> }
            </>
        }/>
}

export default CampaignExplanationDialog