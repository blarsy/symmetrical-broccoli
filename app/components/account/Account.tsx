import React, { useContext } from "react"
import { ScrollView } from "react-native"
import LoadedZone from "../LoadedZone"
import { gql, useQuery } from "@apollo/client"
import ViewField from "../ViewField"
import { t } from "@/i18n"
import { Avatar, Text } from "react-native-paper"
import { urlFromPublicId } from "@/lib/images"
import { adaptToWidth } from "@/lib/utils"
import { Resource, fromServerGraphResource } from "@/lib/schema"
import LoadedList from "../LoadedList"
import { AppContext } from "../AppContextProvider"
import AccountResourceCard from "../resources/AccountResourceCard"


export const GET_ACCOUNT = gql`query Account($id: Int!) {
  accountById(id: $id) {
    email
    name
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
  }
}`

interface Props {
    id: number,
    viewResourceRequested: (resource: Resource) => void
    chatOpenRequested: (resource: Resource) => void
}

export const Account = ({ id }: Props) => {
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
                            <Avatar.Image source={{ uri: urlFromPublicId(data.accountById.imageByAvatarImageId.publicId)}} size={adaptToWidth(150, 250, 300)} />
                        </ViewField>
                    }
                    { data.accountById.resourcesByAccountId.nodes && 
                        <ViewField title={t('available_resources')} titleOnOwnLine>
                            <LoadedList loading={false} data={data.accountById.resourcesByAccountId.nodes} 
                                contentContainerStyle={{ gap: 10 }}
                                displayItem={(rawRes: any) => {
                                        const resource = fromServerGraphResource(rawRes, appContext.categories.data!)
                                        return <AccountResourceCard key={rawRes.id} resource={resource} onPress={() => {}} onChatOpen={() => {}} />
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