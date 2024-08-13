import React, { useContext, useEffect, useState } from "react"
import OperationFeedback, { InfoSnackbar } from "../OperationFeedback"
import EditLinkModal from "./EditLinkModal"
import { Link, Location, getIconForLink, parseLocationFromGraph } from "@/lib/schema"
import LoadedZone from "../LoadedZone"
import { gql, useMutation, useQuery } from "@apollo/client"
import { AppContext } from "../AppContextProvider"
import ListOf from "../ListOf"
import { ActivityIndicator, Button, Icon, IconButton, Portal, Snackbar, Text } from "react-native-paper"
import { DimensionValue, FlexAlignType, Linking, StyleProp, View, ViewStyle } from "react-native"
import { adaptToWidth, fontSizeSmall, mdScreenWidth } from "@/lib/utils"
import { Hr } from "../layout/lib"
import { t } from "i18next"
import { ScrollView } from "react-native-gesture-handler"
import LocationEdit from "./LocationEdit"

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
      locationByLocationId {
        address
        latitude
        longitude
        id
      }
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

const LinksEdit = ({ links, newLinkRequested, editLinkRequested, deleteLinkRequested, style }: LinksEditProps) => <View style={{...{ alignItems: 'center' }, ...(style as object || {})}}>
    <ListOf data={links} noDataLabel={t('no_link')} noDataLabelStyle={{ color: '#fff' }}
        displayItem={(link, idx) => <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch' }}>
        <Icon color="#fff" source={getIconForLink(link.type)} size={25}/>
        <Button style={{ flex: 1 }} compact labelStyle={{ fontSize: fontSizeSmall }} textColor="#fff" 
            mode="text" onPress={() => Linking.openURL(link.url)}>{ link.label || t('link_button_default_label') }</Button>
        <IconButton containerColor="#fff" iconColor="#000" icon="file-edit-outline" onPress={() => editLinkRequested(link)} />
        <IconButton containerColor="#fff" iconColor="#000" icon="delete" onPress={() => deleteLinkRequested(link)} />
    </View>} />
    <Button style={{ backgroundColor: '#fff' }} textColor="#000" icon="link-plus" onPress={newLinkRequested}>{t('add_buttonLabel')}</Button>
</View>

export default () => {
    const [success, setSuccess] = useState(false)
    const appContext = useContext(AppContext)
    const [editedLink, setEditedLink] = useState<Link | undefined>(undefined)
    const [updateAccount, { loading: updating, error: updateError, reset }] = useMutation(UPDATE_ACCOUNT_PUBLIC_INFO)
    const { data, loading, error } = useQuery(GET_ACCOUNT_INFO, { variables: { id: appContext.account!.id } })
    const [publicInfo, setPublicInfo] = useState<{ links: Link[], location: Location | null}>({ links: [], location: null })

    useEffect(() => {
        if(data) setPublicInfo({
            links: data.accountById.accountsLinksByAccountId.nodes.map((raw: any) => ({
                id: raw.id, label: raw.label, type: raw.linkTypeByLinkTypeId.id, url: raw.url
            } as Link)),
            location: parseLocationFromGraph(data.accountById.locationByLocationId)
        })
    }, [data])

    const update = async(publicInfo: {
        links: Link[];
        location: Location | null;
    }) => {
        await updateAccount({ variables: { 
            links: publicInfo.links.map(link => ({ label: link.label, url: link.url, linkTypeId: link.type })),
            location: publicInfo.location
        } })
        // refetch()
        setSuccess(true)
    }
    
    return <ScrollView style={{ flex: 1, flexDirection: 'column', backgroundColor: 'transparent' }} contentContainerStyle={{ alignItems: adaptToWidth<FlexAlignType>('stretch', 'center', 'center') }}>
        <LoadedZone loading={loading} error={error} loadIndicatorColor="#fff" 
            containerStyle={{ paddingTop: 10, paddingHorizontal: 10, flex: 1, justifyContent: 'center', width: adaptToWidth<DimensionValue>('auto', mdScreenWidth, mdScreenWidth) }} >
            <Text variant="headlineLarge" style={{ flex: 1, color: '#fff', textAlign: 'center', paddingBottom: 20 }}>{t('publicInfo_settings_title')}</Text>
            <LinksEdit style={{ paddingBottom: 20 }} links={publicInfo.links}
                deleteLinkRequested={link => {
                    const newPublicInfo = { links: publicInfo.links.filter(l => l.id != link.id), location: publicInfo.location }
                    setPublicInfo(newPublicInfo)
                    update(newPublicInfo)
                }}
                editLinkRequested={setEditedLink}
                newLinkRequested={() => { setEditedLink({ id: 0, label: '', type: 4, url: '' }) }} />
            <Hr color="#fff" thick />
            <Text variant="headlineLarge" style={{ flex: 1, color: '#fff', textAlign: 'center', paddingBottom: 10, paddingTop: 20 }}>{t('publicInfo_address_title')}</Text>
            <LocationEdit location={publicInfo.location || undefined} 
                onLocationChanged={newLocation => {
                    const newPublicInfo = { links: publicInfo.links, location: newLocation }
                    setPublicInfo(newPublicInfo)
                    update(newPublicInfo)
                }}
                onDeleteRequested={() => {
                    const newPublicInfo = { location: null, links: publicInfo.links }
                    setPublicInfo(newPublicInfo)
                    update(newPublicInfo)
                }} 
                orangeBackground />
            <OperationFeedback error={updateError} success={success} onDismissError={reset} onDismissSuccess={() => setSuccess(false)} />
            <EditLinkModal visible={!!editedLink} initial={editedLink} onDismiss={link => {
                if(link) {
                    let newLinks: Link[]
                    if(link.id === 0) {
                        const newLinkInternalId = publicInfo.links.reduce<number>((prev, current) => {
                            if(current.id < prev)
                                return current.id

                            return prev
                        }, 0)
                        publicInfo.links.push({ ...link, ...{ id: newLinkInternalId - 1 }})
                        newLinks = [...publicInfo.links]
                    } else {
                        const idx = publicInfo.links.findIndex(l => l.id === link.id)
                        publicInfo.links.splice(idx, 1, link)
                        newLinks = [...publicInfo.links]
                    }
                    const newPublicInfo = { links: newLinks, location: publicInfo.location }
                    setPublicInfo(newPublicInfo)
                    update(newPublicInfo)
                }
                setEditedLink(undefined)
            }} />
        </LoadedZone>
        <Portal>
            { updating && <InfoSnackbar message={t('updating_status_message')} /> }
        </Portal>
    </ScrollView>
}