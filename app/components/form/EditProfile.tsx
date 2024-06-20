import { Formik, ErrorMessage } from "formik"
import React, { useContext, useEffect, useState } from "react"
import * as yup from 'yup'
import { aboveMdWidth, adaptToWidth, fontSizeSmall, initials, pickImage } from "@/lib/utils"
import { t } from '@/i18n'
import { WhiteButton, OrangeTextInput, StyledLabel, OrangeBackedErrorText } from "@/components/layout/lib"
import { Linking, View } from "react-native"
import { gql, useMutation, useQuery } from "@apollo/client"
import OperationFeedback from "../OperationFeedback"
import { Avatar, Banner, Button, Icon, IconButton, Portal, Text } from "react-native-paper"
import { uploadImage, urlFromPublicId } from "@/lib/images"
import { AppContext, AppDispatchContext, AppReducerActionType } from "../AppContextProvider"
import { AccountInfo, Link, getIconForLink } from "@/lib/schema"
import ListOf from "../ListOf"
import LoadedZone from "../LoadedZone"
import EditLinkModal from "../account/EditLinkModal"

export const GET_ACCOUNT_INFO = gql`query AccountInfoById($id: Int!) {
    accountById(id: $id) {
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
    }
}`

const UPDATE_ACCOUNT = gql`mutation UpdateAccount($email: String, $name: String, $avatarPublicId: String, $links: [AccountLinkInput]) {
    updateAccount(
      input: {email: $email, name: $name, avatarPublicId: $avatarPublicId, links: $links}
    ) {
      integer
    }
}`

interface LinksEditProps {
    links: Link[]
    newLinkRequested: () => void
    editLinkRequested: (link: Link) => void
    deleteLinkRequested: (link: Link) => void
}

const LinksEdit = ({ links, newLinkRequested, editLinkRequested, deleteLinkRequested }: LinksEditProps) => <View style={{ alignItems: 'center' }}>
    <ListOf data={links} noDataLabel={t('no_link')} noDataLabelStyle={{ color: '#fff' }}
        displayItem={(link, idx) => <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch' }}>
        <Icon color="#fff" source={getIconForLink(link.type)} size={25}/>
        <Button style={{ flex: 1 }} compact labelStyle={{ fontSize: fontSizeSmall }} textColor="#fff" 
            mode="text" onPress={() => Linking.openURL(link.url)}>{ link.label || t('link_button_default_label') }</Button>
        <IconButton iconColor="#fff" icon="file-edit-outline" onPress={() => editLinkRequested(link)} />
        <IconButton iconColor="#fff" icon="delete" onPress={() => deleteLinkRequested(link)} />
    </View>} />
    <IconButton size={25} containerColor="#fff" iconColor="#000" icon="link-plus" onPress={newLinkRequested} />
</View>

export default function EditProfile () {
    const appContext = useContext(AppContext)
    const appDispatch = useContext(AppDispatchContext)
    const { data, loading, error } = useQuery(GET_ACCOUNT_INFO, { variables: { id: appContext.account!.id } })
    const [updateAccount, { loading: updating, error: updateError, reset }] = useMutation(UPDATE_ACCOUNT)
    const [newEmailMustBeActivated, setNewEmailMustBeActivated] = useState(false)
    const [success, setSuccess] = useState(false)
    const [editedLink, setEditedLink] = useState<Link | undefined>(undefined)
    const [initialFormValues, setInitialFormValues] = useState({
        email: appContext.account!.email, 
        name: appContext.account!.name,
        avatarPublicId: appContext.account!.avatarPublicId,
        links: []
    })

    const update = async (values: {
        email: string
        name: string
        avatarPublicId: string
        links: Link[]
    }) => {
        const currentAccount = appContext.account! as AccountInfo & { links: any[] }
        let emailHasChanged = false

        if(currentAccount.email != values.email.toLowerCase()){
            emailHasChanged = true
        }

        currentAccount.email = values.email
        currentAccount.name = values.name
        currentAccount.avatarPublicId = values.avatarPublicId
        currentAccount.links = values.links.map(l => ({
            linkTypeId: l.type,
            url: l.url,
            label: l.label
        }))
        await updateAccount({ variables: currentAccount })
        setSuccess(true)

        setNewEmailMustBeActivated(emailHasChanged)

        appDispatch({ type: AppReducerActionType.UpdateAccount, payload: currentAccount })
    }

    useEffect(() => {
        if(data) {
            setInitialFormValues({ ...initialFormValues, ...{ links: data && data.accountById.accountsLinksByAccountId.nodes.map((rawLink: any) => ({ label: rawLink.label, type: rawLink.linkTypeByLinkTypeId.id, url: rawLink.url, id: rawLink.id } as Link)) } })
        }
    }, [data])

    return <Formik enableReinitialize initialValues={initialFormValues} validationSchema={yup.object().shape({
        name: yup.string().required(t('field_required')).max(30, t('name_too_long')),
        email: yup.string().email(t('invalid_email')),
        avatarPublicId: yup.string().nullable()
    })} onSubmit={update}>
    {({ handleChange, handleBlur, handleSubmit, values, setFieldValue }) => (
        <View style={{ flex: 1, padding: 10 }}>
            <Banner visible={newEmailMustBeActivated}>{t('newEmailMustBeActivated_message')}</Banner>
            <View style={{ alignItems: 'center' }}>
                { values.avatarPublicId ? 
                    <Avatar.Image source={{ uri: urlFromPublicId(values.avatarPublicId)}} size={adaptToWidth(150, 250, 300)} /> :
                    <Avatar.Text label={initials(values.name)} size={adaptToWidth(150, 250, 300)} />}
            </View>
            <WhiteButton style={{ alignSelf: 'center', marginVertical: 10}} onPress={() => pickImage(async img => {
                try {
                    const avatarPublicId = await uploadImage(img.uri)
                    setFieldValue('avatarPublicId', avatarPublicId)
                    update({ ...values, ...{ avatarPublicId }})
                } catch (e) {
                    appDispatch({ type: AppReducerActionType.DisplayNotification, payload: { error: e as Error} })
                }
            }, 200)}>
                {t('modify_logo')}
            </WhiteButton>
            <OrangeTextInput style={{ flex: 1 }} label={<StyledLabel label={t('organization_name_label')} color="#fff"/>} textContentType="name" value={values.name}
                onChangeText={handleChange('name')} onBlur={handleBlur('name')} />
            <ErrorMessage component={OrangeBackedErrorText} name="name" />
            <OrangeTextInput label={<StyledLabel label={t('email_label')} color="#fff"/>} textContentType="emailAddress" value={values.email}
                onChangeText={handleChange('email')} onBlur={handleBlur('email')} />
            <ErrorMessage component={OrangeBackedErrorText} name="email" />
            <LoadedZone loading={loading} error={error} loadIndicatorColor="#fff">
                <LinksEdit links={values.links}
                    deleteLinkRequested={link => setFieldValue('links', values.links.filter(l => l.id != link.id))}
                    editLinkRequested={setEditedLink}
                    newLinkRequested={() => { setEditedLink({ id: 0, label: '', type: 4, url: '' }) }} />
            </LoadedZone>
            <WhiteButton disabled={loading} style={{ marginTop: 20, width: aboveMdWidth() ? '60%' : '80%', alignSelf: 'center' }} onPress={e => handleSubmit()} loading={updating}>
                {t('save_label')}
            </WhiteButton>
            <OperationFeedback error={updateError} success={success} onDismissError={reset} onDismissSuccess={() => setSuccess(false)} />
            <Portal>
                <EditLinkModal visible={!!editedLink} initial={editedLink} onDismiss={link => {
                    if(link) {
                        let newLinks: Link[]
                        if(link.id === 0) {
                            const newLinkInternalId = values.links.reduce<number>((prev, current) => {
                                if(current.id < prev)
                                    return current.id

                                return prev
                            }, 0)
                            values.links.push({ ...link, ...{ id: newLinkInternalId - 1 }})
                            newLinks = [...values.links]
                        } else {
                            const idx = values.links.findIndex(l => l.id === link.id)
                            values.links.splice(idx, 1, link)
                            newLinks = [...values.links]
                        }
                        setFieldValue('links', newLinks)
                    }
                    setEditedLink(undefined)
                }} />
            </Portal>
        </View>)}
    </Formik>  
}