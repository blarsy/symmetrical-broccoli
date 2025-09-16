import React, { useContext, useEffect, useState } from "react"
import EditProfile from "@/components/form/EditProfile"
import PrimaryColoredContainer from "@/components/layout/PrimaryColoredContainer"
import { ActivityIndicator, DimensionValue, FlexAlignType, ScrollView, View } from "react-native"
import { RouteProps, adaptToWidth, getAppBarsTitleFontSize, mdScreenWidth } from "@/lib/utils"
import { t } from "@/i18n"
import { Appbar, Button, Dialog, Icon, IconButton, Portal, Switch, Text } from "react-native-paper"
import ChangePassword from "../form/ChangePassword"
import { initial, beginOperation, fromData, fromError } from "@/lib/DataLoadState"
import { ErrorSnackbar } from "../OperationFeedback"
import { lightPrimaryColor, primaryColor } from "../layout/constants"
import { AppAlertDispatchContext, AppAlertReducerActionType, AppContext } from "../AppContextProvider"
import useUserConnectionFunctions from "@/lib/useUserConnectionFunctions"
import Preferences from "./Preferences"
import { createMaterialBottomTabNavigator } from 'react-native-paper/react-navigation'
import { GraphQlLib } from "@/lib/backendFacade"
import { useMutation } from "@apollo/client"
import Images from "@/Images"
import TokenSettings from "../tokens/TokenSettings"
import { TabNavigatorProps } from "@/lib/TabNavigatorProps"

const Tab = createMaterialBottomTabNavigator()

export const ProfileMain = ({ route, navigation }: RouteProps) => {
    const appContext = useContext(AppContext)
    const [changingPassword, setChangingPassword] = useState(false)
    const [deletingAccount, setDeletingAccount] = useState(false)
    const [confirmedAccountDelete, setConfirmedAccountDelete] = useState(false)
    const [deleting, setDeleting] = useState(initial<null>(false, null))
    const [deleteAccount] = useMutation(GraphQlLib.mutations.DELETE_ACCOUNT)
    const appAlertDispatch = useContext(AppAlertDispatchContext)
    const { logout } = useUserConnectionFunctions()

    return <ScrollView style={{ flex: 1, flexDirection: 'column', backgroundColor: 'transparent' }} contentContainerStyle={{ alignItems: adaptToWidth<FlexAlignType>('stretch', 'center', 'center') }}>
        <View style={{ gap: 30, width: adaptToWidth<DimensionValue>('auto', mdScreenWidth, mdScreenWidth), margin: 10 }}>
            {changingPassword ? 
                <ChangePassword onDone={success => {
                    if(success) appAlertDispatch({ type: AppAlertReducerActionType.DisplayNotification, payload: { message: t('password_changed_message') } })
                    setChangingPassword(false)
                }}/> : 
                <View>
                    { appContext.account && <EditProfile account={appContext.account} /> }
                    <Button style={{ alignSelf: 'flex-end' }} textColor="#000" mode="text" onPress={() => setChangingPassword(true)}>{t('change_password_label')}<Icon size={20} source="chevron-right"/></Button>
                    <Button style={{ alignSelf: 'flex-end' }} textColor="#000" mode="text" onPress={() => setDeletingAccount(true)}>{t('delete_account_button')}<Icon size={20} source="account-remove"/></Button>
                </View>}
            <Portal>
                <Dialog visible={deletingAccount} style={{ backgroundColor: '#fff' }}>
                    <Dialog.Title><Text variant="titleLarge">{t('delete_account_title')}</Text></Dialog.Title>
                    <Dialog.Content style={{ display: 'flex', gap: 15 }}>
                        <Text variant="bodyMedium">{t('delete_account_explanation')}</Text>
                        <View style={{ borderColor: 'red', borderWidth: 2, padding: 2, borderRadius: 10 }}>
                            <Text variant="bodyMedium">{t('delete_account_confirmation')}</Text>
                            <Switch style={{ alignSelf: 'center', margin: 5 }} value={confirmedAccountDelete} onValueChange={() =>{
                                setConfirmedAccountDelete(!confirmedAccountDelete)}
                            } />
                            <Text style={{ alignSelf: 'center' }}>{confirmedAccountDelete ? t('yes') : t('no')}</Text>
                        </View>
                        { deleting.loading && <ActivityIndicator /> }
                        <Portal>
                            <ErrorSnackbar testID="deleteAccountError" message={deleting.error ? deleting.error.message : undefined} onDismissError={() => setDeleting(initial(false, null))} />
                        </Portal>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <IconButton disabled={!confirmedAccountDelete} size={30} iconColor="#000" icon={p => <Images.Check fill={p.color}/>} onPress={async () => {
                            setDeleting(beginOperation())
                            try {
                                await deleteAccount()
                                await logout()
                                navigation.reset({ routes: [
                                    {name: 'board'}
                                ], index: 0 })
                                navigation.goBack()
                                setDeleting(fromData(null))
                            } catch(e) {
                                setDeleting(fromError(e))
                            }
                        } }/>
                        <IconButton size={30} icon={p => <Images.Cross fill={p.color} />} iconColor={primaryColor} onPress={async () => { 
                            setDeletingAccount(false) 
                            setConfirmedAccountDelete(false)
                        } }/>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    </ScrollView>
}

export default function Profile ({ route, navigation }: RouteProps) {
    const appContext = useContext(AppContext)
    const { logout } = useUserConnectionFunctions()

    useEffect(() => {
        if(!appContext.account) {
            navigation.navigate('board')
        }
    }, [])

    const fixedScreens: TabNavigatorProps[] = [
        { name:'main', options:{ title: t('main_profile_label').toUpperCase(), tabBarIcon: p => <Images.Profile height="30" width="30" fill={p.color} /> }, component: ProfileMain },
        { name:'preferences', options:{ title: t('preferences_profile_label').toUpperCase(), tabBarIcon: p => <Images.Preferences height="30" width="30" fill={p.color} /> }, component: Preferences },
    ]

    const actualScreens = appContext.account ? 
        [
            fixedScreens[0],
            { name:'tokens', options:{ title: t('tokensProfileLabel').toUpperCase(), tabBarIcon: (p: any) => <Images.TokensBlack fill={p.color} width={30} height={30} />}, component: TokenSettings }, 
            fixedScreens[1]
        ]
        : 
        fixedScreens

    return <PrimaryColoredContainer style={{ flex: 1, alignItems: 'stretch'}}>
        <Appbar.Header mode="center-aligned" style={{ backgroundColor: primaryColor }}>
            <Appbar.BackAction testID="Profile:BackButton" onPress={() => navigation.navigate('board')} />
            <Appbar.Content titleStyle={{ textTransform: 'uppercase', fontWeight: '400', 
                fontSize: getAppBarsTitleFontSize(), lineHeight: getAppBarsTitleFontSize() }} 
                title={t('profile_label')}  />
            <Appbar.Action testID="logout" icon="logout" size={getAppBarsTitleFontSize()} color="#000" onPress={ async () => {
                await logout()
                navigation.reset({ routes: [
                    {name: 'board'}
                ], index: 0 })
            }} />
        </Appbar.Header>
        <Tab.Navigator barStyle={{ backgroundColor: lightPrimaryColor }} 
            theme={{ colors: { secondaryContainer: lightPrimaryColor, background: 'transparent' }}}
            activeColor={ primaryColor } inactiveColor="#000" style={{ backgroundColor: 'transparent' }} >
            { actualScreens.map((screen, idx) => <Tab.Screen key={idx} name={screen.name} options={screen.options} component={screen.component} />) }
        </Tab.Navigator>
    </PrimaryColoredContainer>
}