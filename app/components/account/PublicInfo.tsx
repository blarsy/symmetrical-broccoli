import React, { useContext, useEffect, useState } from "react"
import OperationFeedback from "../OperationFeedback"
import EditLinkModal from "./EditLinkModal"
import { Link, Location, getIconForLink } from "@/lib/schema"
import LoadedZone from "../LoadedZone"
import { gql, useMutation, useQuery } from "@apollo/client"
import { AppContext } from "../AppContextProvider"
import ListOf from "../ListOf"
import { Button, Icon, IconButton, Text } from "react-native-paper"
import { DimensionValue, FlexAlignType, Linking, View } from "react-native"
import { aboveMdWidth, adaptToWidth, fontSizeSmall, mdScreenWidth } from "@/lib/utils"
import { WhiteButton } from "../layout/lib"
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

export const parseLocationFromGraph = (raw: any): Location | null => {
    if(raw === null) return null

    return ({
        address: raw.address,
        latitude: parseFloat(raw.latitude),
        longitude: parseFloat(raw.longitude)
    })
}

export default () => {
    const [success, setSuccess] = useState(false)
    const appContext = useContext(AppContext)
    const [editedLink, setEditedLink] = useState<Link | undefined>(undefined)
    const [updateAccount, { loading: updating, error: updateError, reset }] = useMutation(UPDATE_ACCOUNT_PUBLIC_INFO)
    const { data, loading, error, refetch } = useQuery(GET_ACCOUNT_INFO, { variables: { id: appContext.account!.id } })
    const [publicInfo, setPublicInfo] = useState<{ links: Link[], location: Location | null}>({ links: [], location: null })

    useEffect(() => {
        if(data) setPublicInfo({
            links: data.accountById.accountsLinksByAccountId.nodes.map((raw: any) => ({
                id: raw.id, label: raw.label, type: raw.linkTypeByLinkTypeId.id, url: raw.url
            } as Link)),
            location: parseLocationFromGraph(data.accountById.locationByLocationId)
        })
    }, [data])
    
    return <ScrollView style={{ flex: 1, flexDirection: 'column', backgroundColor: 'transparent' }} contentContainerStyle={{ alignItems: adaptToWidth<FlexAlignType>('stretch', 'center', 'center') }}>
        <LoadedZone loading={loading} error={error} loadIndicatorColor="#fff" 
            containerStyle={{ paddingTop: 10, paddingHorizontal: 10, flex: 1, justifyContent: 'center', width: adaptToWidth<DimensionValue>('auto', mdScreenWidth, mdScreenWidth) }} >
            <Text variant="headlineMedium" style={{ flex: 1, color: '#fff', textAlign: 'center', paddingBottom: 10 }}>{t('publicInfo_settings_title')}</Text>
            <LinksEdit links={publicInfo.links}
                deleteLinkRequested={link => setPublicInfo({ links: publicInfo.links.filter(l => l.id != link.id), location: publicInfo.location })}
                editLinkRequested={setEditedLink}
                newLinkRequested={() => { setEditedLink({ id: 0, label: '', type: 4, url: '' }) }} />
            <Text variant="headlineMedium" style={{ flex: 1, color: '#fff', textAlign: 'center', paddingVertical: 10 }}>{t('publicInfo_address_title')}</Text>
            <LocationEdit location={publicInfo.location || undefined} 
                onLocationChanged={newLocation => setPublicInfo({ links: publicInfo.links, location: newLocation }) }
                onDeleteRequested={() => setPublicInfo({ location: null, links: publicInfo.links })} 
                orangeBackground />
            <WhiteButton disabled={loading} style={{ marginTop: 20, width: aboveMdWidth() ? '60%' : '80%', alignSelf: 'center' }}
                onPress={async() => {
                    await updateAccount({ variables: { 
                        links: publicInfo.links.map(link => ({ label: link.label, url: link.url, linkTypeId: link.type })),
                        location: publicInfo.location
                    } })
                    refetch()
                    setSuccess(true)
                }} loading={updating}>
                {t('save_label')}
            </WhiteButton>
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
                    setPublicInfo({ links: newLinks, location: publicInfo.location })
                }
                setEditedLink(undefined)
            }} />
        </LoadedZone>
    </ScrollView>
}