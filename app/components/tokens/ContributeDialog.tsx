import { t } from "i18next"
import React, { useContext, useState } from "react"
import { Dimensions, View } from "react-native"
import { ThemedDialog } from "../ConfirmDialog"
import HowItWorksSwiper from "./HowItWorksSwiper"
import Images from "@/Images"
import { OrangeButton } from "../layout/lib"
import { GraphQlLib } from "@/lib/backendFacade"
import useUserConnectionFunctions from "@/lib/useUserConnectionFunctions"
import { useMutation } from "@apollo/client"
import { Text } from "react-native-paper"
import { AppContext } from "../AppContextProvider"

interface Props {
    visible: boolean
    title: string
    testID?: string
    onDismiss: () => void
    onBecameContributor?: () => void
}

const ContributeDialog = (p: Props) => {
    const [switchToContributionMode] = useMutation(GraphQlLib.mutations.SWITCH_TO_CONTRIBUTION_MODE)
    const { reloadAccount } = useUserConnectionFunctions()
    const [ becomingContributor, setBecomingContributor] = useState(false)
    const appContext = useContext(AppContext)

    const { width: winWidth, height: winHeight } = Dimensions.get('screen')
    const width = Math.min(400, winWidth)
    const height = Math.min(winHeight - 120, 700)
    const subViewHeight = height - 80
    const childWidth = width - 52

    return <ThemedDialog testID={p.testID} onDismiss={p.onDismiss} visible={p.visible} 
        title={p.title} style={{
            width, height, marginTop: 0, marginLeft: width === winWidth ? 0 : (winWidth - width) / 2,
        }} contentStyle={{ height: subViewHeight }}
        content={
            <View>
                <HowItWorksSwiper width={childWidth} />
                { appContext.account && !appContext.account.willingToContribute && <OrangeButton testID={`${p.testID}:YesButton`} loading={becomingContributor} labelStyle={{ alignItems: 'center' }}
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
                        <Text style={{ color: '#fff' }} variant="bodyLarge">{`${t('yes')} ${t('becomeContributorButton')}`}</Text>
                    </View>
                </OrangeButton> }
            </View>
        }/>
}

export default ContributeDialog