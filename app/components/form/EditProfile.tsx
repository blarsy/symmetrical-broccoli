import React, { useContext, useEffect, useState } from "react"
import * as yup from 'yup'
import { adaptToWidth, fontSizeSmall, initials, pickImage, SMALL_IMAGEBUTTON_SIZE } from "@/lib/utils"
import { t } from '@/i18n'
import { Linking, StyleProp, View, ViewStyle } from "react-native"
import { gql, useMutation, useQuery } from "@apollo/client"
import OperationFeedback from "../OperationFeedback"
import { Avatar, Banner, Button, Icon, Text } from "react-native-paper"
import { uploadImage, urlFromPublicId } from "@/lib/images"
import { AppAlertDispatchContext, AppAlertReducerActionType, AppDispatchContext, AppReducerActionType } from "../AppContextProvider"
import { AccountInfo, getIconForLink, Link, Location, parseLocationFromGraph } from "@/lib/schema"
import BareIconButton from "../layout/BareIconButton"
import Images from "@/Images"
import InlineFormTextInput from "./InlineFormTextInput"
import { Hr, WhiteReadOnlyField } from "../layout/lib"
import LocationEdit from "../account/LocationEdit"
import LoadedZone from "../LoadedZone"
import ListOf from "../ListOf"
import EditLinkModal from "../account/EditLinkModal"
import { TouchableOpacity } from "../layout/lib"
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

export const GET_ACCOUNT_INFO = gql`query AccountInfoById {
    me {
      id
      accountsLinksByAccountId {
        nodes {
          label
          url
          id
          linkTypeByLinkTypeId {
            id
          }
        }
      }
      locationByLocationId {
        address
        latitude
        longitude
        id
      }
    }
}`

interface LinksEditProps {
    links: Link[]
    newLinkRequested: () => void
    editLinkRequested: (link: Link) => void
    deleteLinkRequested: (link: Link) => void
    style?: StyleProp<ViewStyle>
}

const LinksEdit = ({ links, newLinkRequested, editLinkRequested, deleteLinkRequested, style }: LinksEditProps) => <View style={{ alignItems: 'center', ...(style as object || {})}}>
    <TouchableOpacity testID="addLinkButton" 
        onPress={newLinkRequested}>
        <View style={{ alignSelf: 'flex-start', alignItems: 'center', display: 'flex', flexDirection: 'row', paddingTop: 7, paddingBottom: 7 }}>
            <Icon source="plus" size={25} color="#fff"/>
            <Text variant="labelSmall" style={{ color: '#fff', textTransform: 'uppercase', marginLeft: 7 }}>{t('add_buttonLabel')}</Text>
        </View>
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

interface ProfileData {
    links: Link[]
    location: Location | null
}

export default function EditProfile ({ account }: { account: AccountInfo }) {
    const appDispatch = useContext(AppDispatchContext)
    const appAlertDispatch = useContext(AppAlertDispatchContext)
    const [updateAccount, { error: updateError, reset, data: updateAccountData }] = useMutation(UPDATE_ACCOUNT)
    const [updateAccountEmail, { error: updateEmailError, reset: resetEmail }] = useMutation(UPDATE_ACCOUNT_EMAIL)
    const [newEmailMustBeActivated, setNewEmailMustBeActivated] = useState(false)
    const { data: publicInfoData, error: publicInfoError, loading: loadingPublicInfo } = useQuery(GET_ACCOUNT_INFO, { variables: { id: account.id } })
    const [profileData, setProfileData] = useState<ProfileData>()
    const [updateAccountPublicInfo, { reset: resetPublicInfo, data: publicInfoUpdateData, error: publicInfoUpdateError }] = useMutation(UPDATE_ACCOUNT_PUBLIC_INFO)
    const [editedLink, setEditedLink] = useState<Link | undefined>(undefined)
    
    useEffect(() => {
        if(publicInfoData) {
            setProfileData({
                links: publicInfoData.me.accountsLinksByAccountId.nodes.map((raw: any) => ({
                    id: raw.id, label: raw.label, type: raw.linkTypeByLinkTypeId.id, url: raw.url
                } as Link)),
                location: parseLocationFromGraph(publicInfoData.me.locationByLocationId)
            })
        } else {
            setProfileData(undefined)
        }
    }, [publicInfoData])

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
        const currentAccount = {...account}

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

    return <View style={{ flex: 1, padding: 10 }}>
        <Banner style={{ marginBottom: 10 }} testID="emailChangingBanner" visible={newEmailMustBeActivated}>
            <Text variant="bodyMedium">{t('newEmailMustBeActivated_message')}</Text>
        </Banner>
        <View style={{ alignItems: 'center' }}>
            <View style={{ position: 'relative' }}>
                { account.avatarPublicId ? 
                    <Avatar.Image source={{ uri: urlFromPublicId(account.avatarPublicId)}} size={adaptToWidth(150, 250, 300)} /> :
                    <Avatar.Text label={initials(account.name)} size={adaptToWidth(150, 250, 300)} />}
                <BareIconButton testID="setImageButton" size={SMALL_IMAGEBUTTON_SIZE} Image={Images.ModifyInCircle} color={'#000'} 
                    style={{ position: 'absolute', bottom: 0, right: -SMALL_IMAGEBUTTON_SIZE }}
                    onPress={() => pickImage(async img => {
                    try {
                        const avatarPublicId = await uploadImage(img.uri)
                        await changeLogo(avatarPublicId)
                        appAlertDispatch({ type: AppAlertReducerActionType.DisplayNotification, payload: { message: t('logoChangedMessage') } })
                    } catch (e) {
                        appAlertDispatch({ type: AppAlertReducerActionType.DisplayNotification, payload: { error: e as Error} })
                    }
                }, 200)}/>
            </View>
        </View>
        <InlineFormTextInput testID="name" label={t('organization_name_label')}  textContentType="name" 
            initialValue={account.name} validationSchema={yup.string().required(t('field_required')).max(30, t('name_too_long'))}
            onSave={changeName}/>
        <Hr color="#fff"/>
        { account.numberOfExternalAuthProviders === 0 && <>
            <InlineFormTextInput testID="email" label={t('email_label')} textContentType="emailAddress" 
                initialValue={account.email} validationSchema={yup.string().email(t('invalid_email'))}
                onSave={changeEmail}/> 
            <Hr color="#fff"/>
        </>}
        <LoadedZone testID="PublicInfo" loading={loadingPublicInfo} error={publicInfoError} loadIndicatorColor="#fff">
            {
                profileData && [
                    <WhiteReadOnlyField key="settings" style={{ paddingRight: 0 }} label={t('publicInfo_settings_title')} value={
                        <LinksEdit
                            links={profileData.links}
                            deleteLinkRequested={link => {
                                const newLinks = profileData.links.filter(l => l.id != link.id)
                                updateAccountPublicInfo({ variables: { 
                                    links: newLinks.map(link => ({ label: link.label, url: link.url, linkTypeId: link.type })),
                                    location: profileData.location
                                }})
                                setProfileData(prev => ({ links: newLinks, location: prev?.location } as ProfileData))
                            }}
                            editLinkRequested={setEditedLink}
                            newLinkRequested={() => { 
                                setEditedLink({ id: 0, label: '', type: 4, url: '' }) 
                            }} />} />,
                    <Hr key="line1" color="#fff"/>,
                    <WhiteReadOnlyField key="address" style={{ paddingRight: 0 }} label={t('publicInfo_address_title')} value={
                        <LocationEdit testID="accountAddress" orangeBackground location={profileData.location} 
                            onDeleteRequested={async () => {
                                await updateAccountPublicInfo({ variables: { 
                                    links: profileData.links, 
                                    location: null 
                                }})
                                setProfileData(prev => ({ links: prev?.links, location: null } as ProfileData))
                            }} onLocationChanged={newLocation => {
                                updateAccountPublicInfo({ variables: { 
                                    links: profileData.links, 
                                    location: newLocation 
                                }})
                                setProfileData(prev => ({ links: prev?.links, location: newLocation } as ProfileData))
                            }}/>
                    } />,
                    <Hr key="line2" color="#fff"/>
                ]
            }
        </LoadedZone>
        <OperationFeedback testID="editProfileFeedback" success={!!updateAccountData} successMessage={t('updateAccountSuccessful')} onDismissSuccess={reset} error={updateError} onDismissError={reset} />
        <OperationFeedback testID="editProfileEmailFeedback" error={updateEmailError} onDismissError={resetEmail} />
        <OperationFeedback testID="publicInfoFeedback" success={!!publicInfoUpdateData} onDismissSuccess={resetPublicInfo} error={publicInfoUpdateError} onDismissError={reset} />
        <EditLinkModal testID="editLinkModal" visible={!!editedLink} initial={editedLink} onDismiss={async link => {
            if(link) {
                let newLinks: Link[]
                if(link.id === 0) {
                    const newLinkInternalId = profileData!.links.reduce<number>((prev, current) => {
                        if(current.id < prev)
                            return current.id

                        return prev
                    }, 0)
                    profileData!.links.push({ ...link, ...{ id: newLinkInternalId - 1 }})
                    newLinks = [...profileData!.links]
                } else {
                    const idx = profileData!.links.findIndex(l => l.id === link.id)
                    profileData!.links.splice(idx, 1, link)
                    newLinks = [...profileData!.links]
                }
                
                await updateAccountPublicInfo({ variables: { 
                    links: newLinks.map(link => ({ label: link.label, linkTypeId: link.type , url: link.url })), 
                    location: profileData!.location}})
            }
            setEditedLink(undefined)
        }} />
    </View>
}