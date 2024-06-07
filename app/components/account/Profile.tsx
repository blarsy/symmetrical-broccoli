import React, { useContext, useState } from "react"
import EditProfile from "@/components/form/EditProfile"
import PrimaryColoredContainer from "@/components/layout/PrimaryColoredContainer"
import { ActivityIndicator, ScrollView, View } from "react-native"
import { RouteProps, aboveMdWidth, mdScreenWidth } from "@/lib/utils"
import { t } from "@/i18n"
import { Button, Dialog, Icon, IconButton, Portal, Switch, Text } from "react-native-paper"
import ChangePassword from "../form/ChangePassword"
import { initial, beginOperation, fromData, fromError } from "@/lib/DataLoadState"
import { ErrorSnackbar } from "../OperationFeedback"
import { primaryColor } from "../layout/constants"
import { gql, useMutation } from "@apollo/client"
import { AppDispatchContext, AppReducerActionType } from "../AppContextProvider"
import useUserConnectionFunctions from "@/lib/useUserConnectionFunctions"

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
    const { logout } = useUserConnectionFunctions()
    return <PrimaryColoredContainer style={{ flexDirection: 'row', alignItems: 'center' }}>
        <ScrollView style={{ flex: 1, flexDirection: 'column', margin: 10, 
            alignSelf: "stretch", gap: 30, maxWidth: aboveMdWidth() ? mdScreenWidth : 'auto' }}>
            {changingPassword ? 
                <ChangePassword onDone={success => {
                    if(success) appDispatch({ type: AppReducerActionType.DisplayNotification, payload: { message: t('password_changed_message') } })
                    setChangingPassword(false)
                }}/> : 
                <View>
                    <EditProfile />
                    <Button style={{ alignSelf: 'flex-end' }} textColor="#000" mode="text" onPress={() => setChangingPassword(true)}>{t('change_password_label')}<Icon size={20} source="chevron-right"/></Button>
                    <Button style={{ alignSelf: 'flex-end' }} textColor="#000" mode="text" onPress={() => setDeletingAccount(true)}>{t('delete_account_button')}<Icon size={20} source="account-remove"/></Button>
                </View>}
            <Portal>
                <Dialog visible={deletingAccount} style={{ backgroundColor: '#fff', borderColor: 'red', borderWidth: 3 }}>
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
        </ScrollView>
    </PrimaryColoredContainer>
}