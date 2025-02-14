import Images from "@/Images"
import { t } from "i18next"
import React, { useContext, useState } from "react"
import { View, Image } from "react-native"
import SwiperFlatList from "react-native-swiper-flatlist"
import { OrangeButton } from "../layout/lib"
import { Icon, Text } from "react-native-paper"
import { AppContext } from "../AppContextProvider"
import { useMutation } from "@apollo/client"
import { GraphQlLib } from "@/lib/backendFacade"
import useUserConnectionFunctions from "@/lib/useUserConnectionFunctions"

interface Props {
    width: number
    onBecameContributor: () => void
}

const HowItWorksSwiper = ({ width, onBecameContributor }: Props) => {
    const [switchToContributionMode] = useMutation(GraphQlLib.mutations.SWITCH_TO_CONTRIBUTION_MODE)
    const { reloadAccount } = useUserConnectionFunctions()
    const [ becomingContributor, setBecomingContributor] = useState(false)
    
    const appContext = useContext(AppContext)
    const childWidth = width
    const childPadding = 10
    const childStyle = { width: childWidth, gap: 15, padding: childPadding}
    const childActualSpace = childWidth - (childPadding * 2)
    const tokenSymbolsWidth = childActualSpace * 0.4

    return <SwiperFlatList style={{ width: childWidth }}>
        <View style={childStyle}>
            <Text variant="headlineMedium">{t('howItWorksStep1Title')}</Text>
            <Text variant="bodyMedium">{t('chickenOrEgg')}</Text>
            <Image source={require('@/assets/img/howitworks/chicken-egg.jpg')} height={394 * (childActualSpace / 634)} width={ childWidth } style={{ width: childWidth, height: 394 * (childActualSpace / 634) }}/>
            <View style={{ alignItems: 'center', marginTop: 50 }}>
                <Icon source="gesture-swipe-left" size={60} color="#777"/>
            </View>
        </View>
        <View style={childStyle}>
            <Text variant="headlineMedium">{t('howItWorksStep2Title')}</Text>
            <Text variant="bodyMedium">{t('freeResources')}</Text>
            <Image source={require('@/assets/img/howitworks/free-usage.jpg')} style={{ width: childWidth }}/>
        </View>
        <View style={childStyle}>
            <Text variant="headlineMedium">{t('howItWorksStep3Title')}</Text>
            <Text variant="bodyMedium">{t('needContribution')}</Text>
            <Image source={require('@/assets/img/howitworks/contributor.jpg')} style={{ width: childWidth }}/>
        </View>
        <View style={childStyle}>
            <Text variant="headlineMedium">{t('howItWorksStep4Title')}</Text>
            <Text variant="bodyMedium">{t('resourceConsumption')}</Text>
            <Image source={require('@/assets/img/howitworks/paid-resource.jpg')} style={{ width: childWidth }}/>
        </View>
        <View style={childStyle}>
            <Text variant="headlineMedium">{t('howItWorksStep5Title')}</Text>
            <Text variant="bodyMedium">{t('earnTokens')}</Text>
            <View style={{ display: 'flex', flexDirection: 'row', gap: 20, alignItems: 'center' }}>
                <Image source={require('@/assets/img/howitworks/win-token.jpg')} width={tokenSymbolsWidth} style={{ width : tokenSymbolsWidth, height: (tokenSymbolsWidth / 186 ) * 100 }}/>
                <Text variant="bodyMedium">{t('newResource')}</Text>
            </View>
            <View style={{ display: 'flex', flexDirection: 'row', gap: 20, alignItems: 'center' }}>
                <Image source={require('@/assets/img/howitworks/win-token.jpg')} width={tokenSymbolsWidth} style={{ width : tokenSymbolsWidth, height: (tokenSymbolsWidth / 186 ) * 100}}/>
                <Text variant="bodyMedium">{t('nicePic')}</Text>
            </View>
            <View style={{ display: 'flex', flexDirection: 'row', gap: 20, alignItems: 'center' }}>
                <Image source={require('@/assets/img/howitworks/win-token.jpg')} width={tokenSymbolsWidth} style={{ width : tokenSymbolsWidth, height: (tokenSymbolsWidth / 186 ) * 100}}/>
                <Text variant="bodyMedium">{t('completeProfile')}</Text>
            </View>
            <View style={{ display: 'flex', flexDirection: 'row', gap: 20, alignItems: 'center' }}>
                <Image source={require('@/assets/img/howitworks/win-token.jpg')} width={tokenSymbolsWidth} style={{ width : tokenSymbolsWidth, height: (tokenSymbolsWidth / 186 ) * 100}}/>
                <Text variant="bodyMedium">...</Text>
            </View>
        </View>
        { !appContext.account?.willingToContribute && <View style={childStyle}>
            <Text variant="headlineMedium">{t('howItWorksStep6Title')}</Text>
            <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
                <Text variant="bodyMedium">{t('youAlreadyHave')}</Text>
                <Text variant="bodyMedium">{appContext.account?.amountOfTokens}</Text>
                <Images.Tokens style={{ width: 30, height: 30 }}/>
                <Text variant="bodyMedium">{t('tokenName')}</Text>
            </View>
            <OrangeButton loading={becomingContributor} labelStyle={{ alignItems: 'center', padding: 1 }}
                onPress={ async () => {
                    setBecomingContributor(true)
                    try {
                        await switchToContributionMode()
                        await reloadAccount()
                        onBecameContributor()
                    } finally {
                        setBecomingContributor(false)
                    }
                }}
                icon={p => <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
                <Text style={{ color: '#fff' }} variant="bodySmall">+ 30</Text>
                <Images.TokensBlack fill="#fff" style={{ width: 25, height: 25 }}/>
                </View>}><View style={{ alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff' }} variant="bodyLarge">{t('yes')}</Text>
                    <Text style={{ color: '#fff' }} variant="bodyMedium">{t('becomeContributorButton')}</Text>
                </View>
            </OrangeButton>
        </View>}
    </SwiperFlatList>
}

export default HowItWorksSwiper