import React, { useContext, useEffect, useState } from "react"
import OperationFeedback from "../OperationFeedback"
import EditLinkModal from "./EditLinkModal"
import { Link, getIconForLink } from "@/lib/schema"
import LoadedZone from "../LoadedZone"
import { gql, useMutation, useQuery } from "@apollo/client"
import { AppContext } from "../AppContextProvider"
import ListOf from "../ListOf"
import { Button, Icon, IconButton, Text } from "react-native-paper"
import { DimensionValue, Linking, View } from "react-native"
import { aboveMdWidth, adaptToWidth, fontSizeSmall, mdScreenWidth } from "@/lib/utils"
import { WhiteButton } from "../layout/lib"
import { t } from "i18next"
import { ScrollView } from "react-native-gesture-handler"

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

export const UPDATE_ACCOUNT_PUBLIC_INFO = gql`mutation UpdateAccountPublicInfo($links: [AccountLinkInput]) {
    updateAccountPublicInfo(input: {links: $links}) {
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

export default () => {
    const [success, setSuccess] = useState(false)
    const appContext = useContext(AppContext)
    const [editedLink, setEditedLink] = useState<Link | undefined>(undefined)
    const [updateAccount, { loading: updating, error: updateError, reset }] = useMutation(UPDATE_ACCOUNT_PUBLIC_INFO)
    const { data, loading, error } = useQuery(GET_ACCOUNT_INFO, { variables: { id: appContext.account!.id } })
    const [links, setLinks] = useState<Link[]>([])

    useEffect(() => {
        if(data) setLinks(data.accountById.accountsLinksByAccountId.nodes.map((raw: any) => ({
            id: raw.id, label: raw.label, type: raw.linkTypeByLinkTypeId.id, url: raw.url
        } as Link)))
    }, [])
    
    return <ScrollView style={{ flex: 1, flexDirection: 'column', backgroundColor: 'transparent' }} contentContainerStyle={{ alignItems: 'center' }}>
        <LoadedZone loading={loading} error={error} loadIndicatorColor="#fff" 
            containerStyle={{ paddingTop: 10, flex: 1, justifyContent: 'center', width: adaptToWidth<DimensionValue>('auto', mdScreenWidth, mdScreenWidth) }} >
            <Text variant="headlineMedium" style={{ flex: 1, color: '#fff', textAlign: 'center', paddingBottom: 10 }}>{t('publicInfo_settings_title')}</Text>
            <LinksEdit links={links}
                deleteLinkRequested={link => setLinks(links.filter(l => l.id != link.id))}
                editLinkRequested={setEditedLink}
                newLinkRequested={() => { setEditedLink({ id: 0, label: '', type: 4, url: '' }) }} />
            <WhiteButton disabled={loading} style={{ marginTop: 20, width: aboveMdWidth() ? '60%' : '80%', alignSelf: 'center' }} onPress={e => updateAccount({ variables: { links } })} loading={updating}>
                {t('save_label')}
            </WhiteButton>
            <OperationFeedback error={updateError} success={success} onDismissError={reset} onDismissSuccess={() => setSuccess(false)} />
            <EditLinkModal visible={!!editedLink} initial={editedLink} onDismiss={link => {
                if(link) {
                    let newLinks: Link[]
                    if(link.id === 0) {
                        const newLinkInternalId = links.reduce<number>((prev, current) => {
                            if(current.id < prev)
                                return current.id

                            return prev
                        }, 0)
                        links.push({ ...link, ...{ id: newLinkInternalId - 1 }})
                        newLinks = [...links]
                    } else {
                        const idx = links.findIndex(l => l.id === link.id)
                        links.splice(idx, 1, link)
                        newLinks = [...links]
                    }
                    setLinks(newLinks)
                }
                setEditedLink(undefined)
            }} />
        </LoadedZone>
    </ScrollView>
}