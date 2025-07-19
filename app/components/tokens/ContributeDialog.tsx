import React, { useContext, useState } from "react"
import { Dimensions, View } from "react-native"
import { ThemedDialog } from "../ConfirmDialog"
import HowItWorksSwiper from "./HowItWorksSwiper"
import { AppContext } from "../AppContextProvider"
import { OrangeButton } from "../layout/lib"
import { useMutation } from "@apollo/client"
import { GraphQlLib } from "@/lib/backendFacade"
import useUserConnectionFunctions from "@/lib/useUserConnectionFunctions"
import { Text } from "react-native-paper"
import Images from "@/Images"
import { t } from "@/i18n"
import { GestureHandlerRootView } from "react-native-gesture-handler"

interface Props {
    visible: boolean
    title: string
    testID?: string
    onDismiss: () => void
    onBecameContributor?: () => void
}

const ContributeDialog = (p: Props) => {
    const appContext = useContext(AppContext)
    const { width: winWidth, height: winHeight } = Dimensions.get('screen')
    const width = Math.min(400, winWidth)
    const height = Math.min(winHeight - 120, 700)
    const subViewHeight = height - 80
    const childWidth = width - 52
    const [switchToContributionMode] = useMutation(GraphQlLib.mutations.SWITCH_TO_CONTRIBUTION_MODE)
    const { reloadAccount } = useUserConnectionFunctions()
    const [ becomingContributor, setBecomingContributor] = useState(false)

    return <ThemedDialog testID={p.testID} onDismiss={p.onDismiss} visible={p.visible} 
        style={{
            width, height, marginTop: 0, marginLeft: width === winWidth ? 0 : (winWidth - width) / 2,
        }} contentStyle={{ height: subViewHeight }}
        content={
            <GestureHandlerRootView>
                <View style={{ justifyContent: 'space-between' }}>
                    <HowItWorksSwiper width={childWidth}/>
                    { !appContext.account?.willingToContribute && <View style={{ flex: 0, alignItems: 'center' }}>
                        <OrangeButton testID={`SwitchToContributionModeDialog:YesButton`} loading={becomingContributor} 
                            labelStyle={{ alignItems: 'center' }}
                            onPress={ async () => {
                                setBecomingContributor(true)
                                try {
                                    await switchToContributionMode()
                                    await reloadAccount()
                                    p.onBecameContributor && p.onBecameContributor()
                                } finally {
                                    setBecomingContributor(false)
                                }
                            }}
                            icon={p => <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
                                <Text style={{ color: '#fff' }} variant="bodySmall">+ 30</Text>
                                <Images.TokensBlack fill="#fff" style={{ width: 25, height: 25 }}/>
                                </View>}><View style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
                                    <Text style={{ color: '#fff' }} variant="bodyLarge">{t('becomeContributorButton')}</Text>
                                </View>
                        </OrangeButton>
                    </View>}
                </View>
            </GestureHandlerRootView>
        }/>
}

export default ContributeDialog