import React, { useContext, useState } from "react"
import * as yup from 'yup'
import { adaptToWidth, fontSizeSmall, initials, pickImage, SMALL_IMAGEBUTTON_SIZE } from "@/lib/utils"
import { t } from '@/i18n'
import { Linking, StyleProp, View, ViewStyle } from "react-native"
import { gql, useMutation } from "@apollo/client"
import OperationFeedback from "../OperationFeedback"
import { ActivityIndicator, Avatar, Banner, Button, Icon, IconButton, Text } from "react-native-paper"
import { uploadImage, urlFromPublicId } from "@/lib/images"
import { AppContext, AppDispatchContext, AppReducerActionType } from "../AppContextProvider"
import { AccountInfo, getIconForLink, Link } from "@/lib/schema"
import BareIconButton from "../layout/BareIconButton"
import Images from "@/Images"
import InlineFormTextInput from "./InlineFormTextInput"
import { Hr, WhiteReadOnlyField } from "../layout/lib"
import LocationEdit from "../account/LocationEdit"
import useProfile from "../account/useProfile"
import LoadedZone from "../LoadedZone"
import useUserConnectionFunctions from "@/lib/useUserConnectionFunctions"
import ListOf from "../ListOf"
import EditLinkModal from "../account/EditLinkModal"
import { TouchableOpacity } from "react-native-gesture-handler"
import { lightPrimaryColor } from "../layout/constants"

const UPDATE_ACCOUNT = gql`mutation UpdateAccount($name: String, $avatarPublicId: String) {
    updateAccount(
      input: {name: $name, avatarPublicId: $avatarPublicId}
    ) {
      integer
    }
}`

const UPDATE_ACCOUNT_EMAIL = gql`mutation UpdateAccountEmail($newEmail: String) {
    updateAccountEmail(input: {newEmail: $newEmail}) {
      integer
    }
}`

export const UPDATE_ACCOUNT_PUBLIC_INFO = gql`mutation UpdateAccountPublicInfo($links: [AccountLinkInput], $location: NewLocationInput = null) {
    updateAccountPublicInfo(input: {links: $links, location: $location}) {
      integer
    }
  }
`

interface LinksEditProps {
    links: Link[]
    newLinkRequested: () => void
    editLinkRequested: (link: Link) => void
    deleteLinkRequested: (link: Link) => void
    style?: StyleProp<ViewStyle>
}

const LinksEdit = ({ links, newLinkRequested, editLinkRequested, deleteLinkRequested, style }: LinksEditProps) => <View style={{ alignItems: 'center', ...(style as object || {})}}>
    <TouchableOpacity testID="addLinkButton" 
        style={{ alignSelf: 'flex-start', alignItems: 'center', flexDirection: 'row', paddingTop: 7, paddingBottom: 7 }}
        onPress={newLinkRequested}>
        <Icon source="plus" size={25} color="#fff"/>
        <Text variant="labelSmall" style={{ color: '#fff', textTransform: 'uppercase', flex: 1, marginLeft: 7 }}>{t('add_buttonLabel')}</Text>
    </TouchableOpacity>
    <ListOf testID="LinkList" data={links} noDataLabel={t('no_link')} noDataLabelStyle={{ color: '#fff' }}
        displayItem={(link, idx) => <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch' }}>
        <Icon testID={`link:${idx}:typeIcon`} color="#fff" source={getIconForLink(link.type)} size={25}/>
        <Button testID={`link:${idx}:Button`} style={{ flex: 1, alignItems: 'flex-start' }} compact labelStyle={{ fontSize: fontSizeSmall }} textColor="#fff" 
            mode="text" onPress={() => Linking.openURL(link.url)}>{ link.label || t('link_button_default_label') }</Button>
        <View style={{ flexDirection: 'row', gap: 3 }}>
            <BareIconButton testID={`link:${idx}:EditButton`} size={SMALL_IMAGEBUTTON_SIZE} color="#000" Image={Images.ModifyInCircle}
                onPress={() => { editLinkRequested(link)}} />
            <BareIconButton testID={`link:${idx}:DeleteButton`} size={SMALL_IMAGEBUTTON_SIZE} color={lightPrimaryColor} Image={Images.Remove}
                onPress={() => {deleteLinkRequested(link)}} />
        </View>
    </View>} />
</View>

export default function EditProfile () {
    const appContext = useContext(AppContext)
    const appDispatch = useContext(AppDispatchContext)
    const [updateAccount, { error: updateError, reset }] = useMutation(UPDATE_ACCOUNT)
    const [updateAccountEmail, { error: updateEmailError, reset: resetEmail }] = useMutation(UPDATE_ACCOUNT_EMAIL)
    const [newEmailMustBeActivated, setNewEmailMustBeActivated] = useState(false)
    const publicInfo = useProfile()
    const [editedLink, setEditedLink] = useState<Link | undefined>(undefined)
    
    const changeName = async (name: string) => {
        return handleUpdateAccount({ name })
    }
    
    const changeEmail = async (email: string) => {
        await updateAccountEmail({ variables: { newEmail: email } })
        
        setImmediate(() => setNewEmailMustBeActivated(true))
    }

    const changeLogo = async (avatarPublicId: string) => {
        return handleUpdateAccount({ avatarPublicId })
    }

    const handleUpdateAccount = async ({name, avatarPublicId}: { name?: string, avatarPublicId?: string }) => {
        const currentAccount = appContext.account! as AccountInfo

        if(name) {
            currentAccount.name = name
        }
        if(avatarPublicId) {
            currentAccount.avatarPublicId = avatarPublicId
        }

        await updateAccount({ variables: {
            avatarPublicId: avatarPublicId || currentAccount.avatarPublicId, 
            name: name || currentAccount.name } })

        appDispatch({ type: AppReducerActionType.UpdateAccount, payload: currentAccount })
    }

    if(!appContext.account) return <ActivityIndicator color="#fff"/>

    const account = appContext.account

    return <View style={{ flex: 1, padding: 10 }}>
        <Banner style={{ marginBottom: 10 }} testID="emailChangingBanner" visible={newEmailMustBeActivated}>
            <Text variant="bodyMedium">{t('newEmailMustBeActivated_message')}</Text>
        </Banner>
        <View style={{ alignItems: 'center' }}>
            <View style={{ position: 'relative' }}>
                { account.avatarPublicId ? 
                    <Avatar.Image source={{ uri: urlFromPublicId(account.avatarPublicId)}} size={adaptToWidth(150, 250, 300)} /> :
                    <Avatar.Text label={initials(account.name)} size={adaptToWidth(150, 250, 300)} />}
                <BareIconButton size={SMALL_IMAGEBUTTON_SIZE} Image={Images.ModifyInCircle} color={'#000'} 
                    style={{ position: 'absolute', bottom: 0, right: -SMALL_IMAGEBUTTON_SIZE }}
                    onPress={() => pickImage(async img => {
                    try {
                        const avatarPublicId = await uploadImage(img.uri)
                        await changeLogo(avatarPublicId)
                        appDispatch({ type: AppReducerActionType.DisplayNotification, payload: { message: t('logoChangedMessage') } })
                    } catch (e) {
                        appDispatch({ type: AppReducerActionType.DisplayNotification, payload: { error: e as Error} })
                    }
                }, 200)}/>
            </View>
        </View>
        <InlineFormTextInput testID="name" label={t('organization_name_label')}  textContentType="name" 
            initialValue={account.name} validationSchema={yup.string().required(t('field_required')).max(30, t('name_too_long'))}
            onSave={changeName}/>
        <Hr color="#fff"/>
        <InlineFormTextInput testID="email" label={t('email_label')} textContentType="emailAddress" 
            initialValue={account.email} validationSchema={yup.string().email(t('invalid_email'))}
            onSave={changeEmail}/>
        <Hr color="#fff"/>
        <LoadedZone testID="PublicInfo" {...publicInfo.profileData} loadIndicatorColor="#fff">
            <WhiteReadOnlyField style={{ paddingRight: 0 }} label={t('publicInfo_settings_title')} value={
                <LinksEdit
                    links={publicInfo.profileData.data!.links}
                    deleteLinkRequested={link => {
                        const newLinks = publicInfo.profileData.data!.links.filter(l => l.id != link.id)
                        publicInfo.updatePublicInfo.update(newLinks, publicInfo.profileData.data!.location)
                    }}
                    editLinkRequested={setEditedLink}
                    newLinkRequested={() => { 
                        setEditedLink({ id: 0, label: '', type: 4, url: '' }) 
                    }} />} />
            <Hr color="#fff"/>
            <WhiteReadOnlyField style={{ paddingRight: 0 }} label={t('publicInfo_address_title')} value={
                <LocationEdit orangeBackground location={publicInfo.profileData.data!.location} 
                    onDeleteRequested={async () => {
                        await publicInfo.updatePublicInfo.update(publicInfo.profileData.data!.links, null)
                    }} onLocationChanged={async newLocation => {
                        await publicInfo.updatePublicInfo.update(publicInfo.profileData.data!.links, newLocation)
                    }}/>
            } />
            <Hr color="#fff"/>
        </LoadedZone>
        <OperationFeedback testID="editProfileFeedback" error={updateError} onDismissError={reset} />
        <OperationFeedback testID="editProfileEmailFeedback" error={updateEmailError} onDismissError={resetEmail} />
        <OperationFeedback testID="publicInfoFeedback" error={publicInfo.updatePublicInfo.error} onDismissError={reset} />
        <EditLinkModal testID="editLinkModal" visible={!!editedLink} initial={editedLink} onDismiss={async link => {
            if(link) {
                let newLinks: Link[]
                if(link.id === 0) {
                    const newLinkInternalId = publicInfo.profileData.data!.links.reduce<number>((prev, current) => {
                        if(current.id < prev)
                            return current.id

                        return prev
                    }, 0)
                    publicInfo.profileData.data!.links.push({ ...link, ...{ id: newLinkInternalId - 1 }})
                    newLinks = [...publicInfo.profileData.data!.links]
                } else {
                    const idx = publicInfo.profileData.data!.links.findIndex(l => l.id === link.id)
                    publicInfo.profileData.data!.links.splice(idx, 1, link)
                    newLinks = [...publicInfo.profileData.data!.links]
                }
                
                await publicInfo.updatePublicInfo.update(newLinks, publicInfo.profileData.data!.location)
            }
            setEditedLink(undefined)
        }} />
    </View>
}