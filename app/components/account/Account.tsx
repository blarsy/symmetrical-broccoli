import React, { useContext, useState } from "react"
import { ScrollView, View } from "react-native"
import LoadedZone from "../LoadedZone"
import { gql, useQuery } from "@apollo/client"
import ViewField from "../ViewField"
import { t } from "@/i18n"
import { Avatar, Text } from "react-native-paper"
import { imgSourceFromPublicId } from "@/lib/images"
import { adaptToWidth, regionFromLocation } from "@/lib/utils"
import { Link, Resource, fromServerGraphResource } from "@/lib/schema"
import LoadedList from "../LoadedList"
import { AppContext, AppDispatchContext, AppReducerActionType } from "../AppContextProvider"
import AccountResourceCard from "../resources/AccountResourceCard"
import LinkList from "./LinkList"
import EditLinkModal from "./EditLinkModal"
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps"
import { parseLocationFromGraph } from "./PublicInfo"

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

export const Account = ({ id,chatOpenRequested, viewResourceRequested }: Props) => {
    const { data, loading, error } = useQuery(GET_ACCOUNT, { variables: { id } })
    const appContext = useContext(AppContext)

    return <ScrollView style={{ flex: 1, flexDirection: 'column', padding: 10, backgroundColor: '#fff'}}>
        <LoadedZone loading={loading} error={error}>
            { data && 
                <>
                    <ViewField title={t('organization_name_label')}>
                        <Text variant="bodyMedium" style={{ textTransform: 'uppercase' }}>
                            {data.accountById.name}
                        </Text>
                    </ViewField>
                    { data.accountById.imageByAvatarImageId?.publicId &&
                        <ViewField title="Logo">
                            <Avatar.Image style={{ marginVertical: 10 }} source={imgSourceFromPublicId(data.accountById.imageByAvatarImageId.publicId)} size={adaptToWidth(150, 250, 300)} />
                        </ViewField>
                    }
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
                            <MapView style={{ height: adaptToWidth(200, 300, 550) }} 
                                region={regionFromLocation(parseLocationFromGraph(data.accountById.locationByLocationId)!)}
                                provider={PROVIDER_GOOGLE}>
                                <Marker coordinate={parseLocationFromGraph(data.accountById.locationByLocationId)!} />
                            </MapView>
                        </View>
                    </ViewField> }
                    { data.accountById.resourcesByAccountId.nodes && 
                        <ViewField title={t('available_resources')} titleOnOwnLine>
                            <LoadedList loading={false} noDataLabel={t('no_available_resource')} data={data.accountById.resourcesByAccountId.nodes} 
                                contentContainerStyle={{ gap: 10 }}
                                displayItem={(rawRes: any) => {
                                        const resource = fromServerGraphResource(rawRes, appContext.categories.data!)
                                        return <AccountResourceCard key={rawRes.id} resource={resource} 
                                          onPress={() => viewResourceRequested(resource)} 
                                          onChatOpen={() => chatOpenRequested(resource) } />
                                    }
                                }
                            />
                        </ViewField>
                    }
                </>
            }
        </LoadedZone>
    </ScrollView>
}

export default Account