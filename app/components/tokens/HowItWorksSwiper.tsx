import Images from "@/Images"
import { t } from "i18next"
import React, { FC, useContext, useEffect, useState } from "react"
import { View, ViewStyle, StyleProp } from "react-native"
import SwiperFlatList from "react-native-swiper-flatlist"
import { Icon, Text } from "react-native-paper"
import { AppContext } from "../AppContextProvider"
import ChickenEgg from '@/assets/img/howitworks/chicken-egg.svg'
import Resource1 from '@/assets/img/howitworks/bonnet.svg'
import Resource2 from '@/assets/img/howitworks/Micro-onde.svg'
import Unlock from '@/assets/img/howitworks/unlock.svg'
import ConsumeTokens from '@/assets/img/howitworks/consommation jeton.svg'
import { primaryColor } from "../layout/constants"
import { SvgProps } from "react-native-svg"
import { AnimatedSwipeHand } from "../layout/lib"

const WinToken = () => <View style={{ flexDirection: 'row' }}>
    <Images.Check fill="#4BB543" height={50} width={50} />
    <Images.Tokens  height={50} width={50}/>
</View>

const NumberedImage = ({ numbers, Image, numberSize }: { numbers: number[], Image: FC<SvgProps>, numberSize?: number }) => {
    const actualNumberSize = numberSize || 40
    return <View style={{ position: 'relative' }}>
        <Image />
            { numbers.map((num, idx) => <View key={idx} style={{ position: 'absolute', top: -30, left: -10 + (idx * (actualNumberSize + 5)), transform: [{ rotate: '-20deg' }] }}>
                <Icon size={actualNumberSize} source={`numeric-${num}-circle`} color={primaryColor} />
            </View>)}
    </View>
}

interface Props {
    width: number
    style?: StyleProp<ViewStyle>
}

const HowItWorksSwiper = ({ width, style }: Props) => {
    const appContext = useContext(AppContext)
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
            <View style={childStyle}>
                <Text variant="headlineLarge">{t('howItWorksStep2Title')}</Text>
                <Text variant="bodyLarge">{t('freeResources')}</Text>
                <View style={{ alignItems: 'stretch',
                        borderRadius: 30, alignSelf: 'stretch', paddingBottom: 20, paddingTop: 50, gap: 20 }}>
                    <View style={{ flexGrow: 0, flexShrink: 1, flexDirection: 'row', justifyContent: 'space-around', 
                        paddingTop: 20, paddingBottom: 20 }}>
                        <View style={{ flexBasis: '50%' }}>
                            <NumberedImage numbers={[1]} Image={() => <Resource2 height={childActualSpace * 0.5 / (98/73)}/>} />
                        </View>
                        <View style={{ flexBasis: '30%' }}>
                            <NumberedImage numbers={[2]} Image={() => <Resource1 height={childActualSpace * 0.3 / (406/490)} />} />
                        </View>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start' }}>
                        <Unlock fill="#000" style={{ flexBasis: '20%' }} height={childActualSpace * 0.2}/>
                    </View>
                </View>
            </View>
            <View style={childStyle}>
                <Text variant="headlineLarge">{t('howItWorksStep3Title')}</Text>
                <Text variant="bodyLarge">{t('needContribution')}</Text>
                <Text variant="bodyLarge">{t('resourceConsumption')}</Text>
                <View style={{ alignSelf: 'stretch', borderRadius: 30, paddingTop: 80, paddingHorizontal: 10, gap: 60 }}>
                    <NumberedImage numbers={[3, 4, 5]} Image={() => <ConsumeTokens width='100%' height={childActualSpace / (1027 / 294)}/>}/>
                </View>
            </View>
            <View style={ { ...childStyle, ...{ alignItems: 'flex-start' } }}>
                <Text variant="headlineLarge" style={{ alignSelf: 'center' }}>{t('howItWorksStep4Title')}</Text>
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
                    <Text variant="bodyMedium">...</Text>
                </View>
            </View>
            { !appContext.account?.willingToContribute && <View style={childStyle}>
                <Text variant="headlineLarge">{t('howItWorksStep5Title')}</Text>
                <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
                    <Text variant="bodyLarge">{t('youAlreadyHave')}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, marginBottom: 50 }}>
                    <Text variant="bodyLarge"> {appContext.account?.amountOfTokens}</Text>
                    <Images.Tokens style={{ width: 30, height: 30 }}/>
                    <Text variant="bodyLarge">{t('tokenName')}</Text>
                </View>
            </View>}
        </SwiperFlatList>
        { !swipedToEnd && <AnimatedSwipeHand/> }
    </View>
}

export default HowItWorksSwiper