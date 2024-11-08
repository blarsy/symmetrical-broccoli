import React, { useContext, useEffect, useState } from "react"
import { ImageSourcePropType, ScrollView, View } from "react-native"
import LoadedZone from "../LoadedZone"
import { gql, useQuery } from "@apollo/client"
import ViewField from "../ViewField"
import { t } from "@/i18n"
import { Avatar, Button, Text } from "react-native-paper"
import { IMAGE_BORDER_RADIUS, imgSourceFromPublicId } from "@/lib/images"
import { adaptToWidth, regionFromLocation } from "@/lib/utils"
import { Link, Resource, fromServerGraphResource, parseLocationFromGraph } from "@/lib/schema"
import LoadedList from "../LoadedList"
import { AppContext, } from "../AppContextProvider"
import AccountResourceCard from "../resources/AccountResourceCard"
import LinkList from "./LinkList"
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps"
import dayjs from "dayjs"
import PanZoomImage from "../PanZoomImage"
import { TouchableOpacity } from "react-native-gesture-handler"
import AccordionItem from "../AccordionItem"
import { lightPrimaryColor } from "../layout/constants"
import { WhiteButton } from "../layout/lib"

export const GET_ACCOUNT = gql`query Account($id: Int!) {
  accountById(id: $id) {
    email
    name
    id
    resourcesByAccountId(orderBy: CREATED_DESC) {
      nodes {
        id
        canBeGifted
        canBeExchanged
        title
        deleted
        expiration
        resourcesImagesByResourceId {
          nodes {
            imageByImageId {
              publicId
            }
          }
        }
        resourcesResourceCategoriesByResourceId {
          nodes {
            resourceCategoryCode
          }
        }
        accountByAccountId {
          id
        }
      }
    }
    imageByAvatarImageId {
      publicId
    }
    accountsLinksByAccountId {
      nodes {
        id
        url
        label
        linkTypeByLinkTypeId {
          id
        }
      }
    }
    locationByLocationId {
      address
      id
      longitude
      latitude
    }
  }
}
`

interface Props {
    id: number,
    viewResourceRequested: (resource: Resource) => void
    chatOpenRequested: (resource: Resource) => void
}

export const Account = ({ id, chatOpenRequested, viewResourceRequested }: Props) => {
    const { data, loading, error } = useQuery(GET_ACCOUNT, { variables: { id } })
    const [logoToZoom, setLogotoZoom] = useState<ImageSourcePropType | undefined>(undefined)
    const [accountResources, setAccountResources] = useState<Resource[]>([])
    const [moreInfo, setMoreInfo] = useState(false)
    const appContext = useContext(AppContext)

    useEffect(() => {
        if(data && data.accountById.resourcesByAccountId.nodes) {
            setAccountResources(data.accountById.resourcesByAccountId.nodes
                .filter((res: any) => !res.deleted && dayjs(res.expiration).toDate() > new Date())
                .map((res:any) => fromServerGraphResource(res, appContext.categories.data!)))
        }
    }, [data])

    return <ScrollView style={{ flex: 1, flexDirection: 'column', padding: 10, backgroundColor: '#fff'}}>
        <LoadedZone loading={loading} error={error}>
            { data && 
                <View style={{ gap: 10 }}>
                    <Text variant="titleLarge" style={{ textTransform: 'uppercase', textAlign: 'center', paddingTop: 10 }}>
                        {data.accountById.name}
                    </Text>
                    { data.accountById.imageByAvatarImageId?.publicId ?
                        <TouchableOpacity onPress={() => setLogotoZoom(imgSourceFromPublicId(data.accountById.imageByAvatarImageId.publicId))}
                          containerStyle={{ alignItems: 'center' }}>
                          <Avatar.Image style={{ marginVertical: 10 }} source={imgSourceFromPublicId(data.accountById.imageByAvatarImageId.publicId)} size={adaptToWidth(250, 350, 500)} />
                        </TouchableOpacity>
                        :
                        <View style={{ margin: 15 }}/>
                    }
                    { ((data.accountById.accountsLinksByAccountId.nodes && data.accountById.accountsLinksByAccountId.nodes.length > 0) || data.accountById.locationByLocationId) &&
                    <>
                      <WhiteButton icon={moreInfo ? 'chevron-up' : 'chevron-right'} textColor="#000" style={{ paddingVertical: 15 }}
                        onPress={() => setMoreInfo(!moreInfo)}><Text variant="titleMedium">{moreInfo ? t('lessInfo') : t('moreInfo')}</Text></WhiteButton>
                      { moreInfo && 
                        <View style={{ backgroundColor: lightPrimaryColor, padding: 5, borderRadius: IMAGE_BORDER_RADIUS }}>
                          { data.accountById.accountsLinksByAccountId.nodes && data.accountById.accountsLinksByAccountId.nodes.length > 0 &&
                            <ViewField title={t('links')} titleOnOwnLine>
                              <LinkList values={ data.accountById.accountsLinksByAccountId.nodes.map((link: any) => ({
                                id: link.id,
                                label: link.label,
                                url: link.url,
                                type: link.linkTypeByLinkTypeId.id
                              } as Link)) } />
                            </ViewField>
                          }
                          { data.accountById.locationByLocationId && <ViewField title={t('address_label')} titleOnOwnLine>
                              <View style={{ flexDirection: 'column' }}>
                                  <Text variant="bodySmall" style={{ paddingVertical: 5 }}>{data.accountById.locationByLocationId.address}</Text>
                                  <MapView showsUserLocation={false} style={{ height: adaptToWidth(200, 300, 550) }} 
                                      region={regionFromLocation(parseLocationFromGraph(data.accountById.locationByLocationId)!)}
                                      provider={PROVIDER_GOOGLE}>
                                      <Marker coordinate={parseLocationFromGraph(data.accountById.locationByLocationId)!} />
                                  </MapView>
                              </View>
                          </ViewField> }
                        </View>
                      }
                    </>}
                    <Text variant="titleLarge" style={{ textAlign: 'center', marginTop: 20 }}>{t('available_resources')}</Text>
                    <LoadedList loading={false} noDataLabel={t('no_available_resource')} data={accountResources} 
                        contentContainerStyle={{ gap: 10 }}
                        displayItem={resource => {
                                return <AccountResourceCard key={resource.id} resource={resource} 
                                  onPress={() => viewResourceRequested(resource)} 
                                  onChatOpen={() => chatOpenRequested(resource) } />
                            }
                        }
                    />
                </View>
            }
        </LoadedZone>
        <PanZoomImage source={logoToZoom} onDismess={() => setLogotoZoom(undefined)} />
    </ScrollView>
}

export default Account