import React, { useContext, useState } from "react"
import EditProfile from "@/components/form/EditProfile"
import PrimaryColoredContainer from "@/components/layout/PrimaryColoredContainer"
import { ScrollView, View } from "react-native"
import { aboveMdWidth, mdScreenWidth } from "@/lib/utils"
import { t } from "@/i18n"
import { Button, Icon } from "react-native-paper"
import ChangePassword from "../form/ChangePassword"
import { AppContext } from "../AppContextProvider"

export default function Profile () {
    const [changingPassword, setChangingPassword] = useState(false)
    const appContext = useContext(AppContext)
    return <PrimaryColoredContainer style={{ flexDirection: 'row', alignItems: 'center' }}>
        <ScrollView style={{ flex: 1, flexDirection: 'column', margin: 10, 
            alignSelf: "stretch", gap: 30, maxWidth: aboveMdWidth() ? mdScreenWidth : 'auto' }}>
            {changingPassword ? 
                <ChangePassword onDone={success => {
                    if(success) appContext.actions.notify(t('password_changed_message'))
                    setChangingPassword(false)
                }}/> : 
                <View>
                    <EditProfile />
                    <Button style={{ alignSelf: 'flex-end' }} textColor="#000" mode="text" onPress={() => setChangingPassword(true)}>{t('change_password_label')}<Icon size={20} source="chevron-right"/></Button>
                </View>}
        </ScrollView>
    </PrimaryColoredContainer>
}