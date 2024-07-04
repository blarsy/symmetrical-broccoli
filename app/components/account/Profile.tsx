import React, { useContext, useEffect, useState } from "react"
import EditProfile from "@/components/form/EditProfile"
import PrimaryColoredContainer from "@/components/layout/PrimaryColoredContainer"
import { ActivityIndicator, DimensionValue, FlexAlignType, ScrollView, View } from "react-native"
import { RouteProps, aboveMdWidth, adaptToWidth, mdScreenWidth } from "@/lib/utils"
import { t } from "@/i18n"
import { Button, Dialog, Icon, IconButton, Portal, Switch, Text } from "react-native-paper"
import ChangePassword from "../form/ChangePassword"
import { initial, beginOperation, fromData, fromError } from "@/lib/DataLoadState"
import { ErrorSnackbar } from "../OperationFeedback"
import { lightPrimaryColor, primaryColor } from "../layout/constants"
import { gql, useMutation } from "@apollo/client"
import { AppContext, AppDispatchContext, AppReducerActionType } from "../AppContextProvider"
import useUserConnectionFunctions from "@/lib/useUserConnectionFunctions"
import PublicInfo from "./PublicInfo"
import Preferences from "./Preferences"
import { createMaterialBottomTabNavigator } from 'react-native-paper/react-navigation'

const Tab = createMaterialBottomTabNavigator()

const DELETE_ACCOUNT = gql`mutation DeleteAccount {
    deleteAccount(input: {}) {
        integer
    }
}`

export default function Profile ({ route, navigation }: RouteProps) {
    const [changingPassword, setChangingPassword] = useState(false)
    const [deletingAccount, setDeletingAccount] = useState(false)
    const [confirmedAccountDelete, setConfirmedAccountDelete] = useState(false)
    const [deleting, setDeleting] = useState(initial<null>(false, null))
    const [deleteAccount] = useMutation(DELETE_ACCOUNT)
    const appDispatch = useContext(AppDispatchContext)
    const appContext = useContext(AppContext)
    const { logout } = useUserConnectionFunctions()

    useEffect(() => {
        if(!appContext.account) {
            navigation.navigate('main')
        }
    })

    const Main = () => (<ScrollView style={{ flex: 1, flexDirection: 'column', backgroundColor: 'transparent' }} contentContainerStyle={{ alignItems: adaptToWidth<FlexAlignType>('stretch', 'center', 'center') }}>
        <View style={{ gap: 30, width: adaptToWidth<DimensionValue>('auto', mdScreenWidth, mdScreenWidth), margin: 10 }}>
            {changingPassword ? 
                <ChangePassword onDone={success => {
                    if(success) appDispatch({ type: AppReducerActionType.DisplayNotification, payload: { message: t('password_changed_message') } })
                    setChangingPassword(false)
                }}/> : 
                <View>
                    { appContext.account && <EditProfile /> }
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
                            <ErrorSnackbar message={deleting.error ? deleting.error.message : undefined} onDismissError={() => setDeleting(initial(false, null))} />
                        </Portal>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <IconButton disabled={!confirmedAccountDelete} size={30} iconColor="#000" icon="check" onPress={async () => {
                            setDeleting(beginOperation())
                            try {
                                await deleteAccount()
                                await logout()
                                navigation.reset({ routes: [
                                    {name: 'main'}
                                ], index: 0 })
                                setDeleting(fromData(null))
                            } catch(e) {
                                setDeleting(fromError(e, t('requestError')))
                            }
                        } }/>
                        <IconButton size={30} icon="close" iconColor={primaryColor} onPress={async () => { 
                            setDeletingAccount(false) 
                            setConfirmedAccountDelete(false)
                        } }/>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    </ScrollView>)

    return <PrimaryColoredContainer style={{ flex: 1, alignItems: 'stretch' }}>
        <Tab.Navigator barStyle={{ backgroundColor: lightPrimaryColor }} 
            theme={{ colors: { secondaryContainer: lightPrimaryColor, background: 'transparent' }}}
            activeColor={ primaryColor } style={{ backgroundColor: 'transparent' }}>
            <Tab.Screen name="main" options={{ title: t('main_profile_label'), tabBarIcon: p => <Icon size={30} color={p.color} source="account" /> }} component={Main} />
            <Tab.Screen name="publicInfo" options={{ title: t('publicInfo_profile_label'), tabBarIcon: p => <Icon size={30} color={p.color} source="bullhorn" /> }} component={PublicInfo} />
            <Tab.Screen name="preferences" options={{ title: t('preferences_profile_label'), tabBarIcon: p => <Icon size={30} color={p.color} source="cog" /> }} component={Preferences} />
        </Tab.Navigator>
    </PrimaryColoredContainer>
}