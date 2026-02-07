import { t } from "@/i18n"
import { ConversationData, Resource, fromServerGraphConversations } from "@/lib/schema"
import React, { useContext, useEffect } from "react"
import { View } from "react-native"
import LoadedList from "../LoadedList"
import ResponsiveListItem from "../ResponsiveListItem"
import { Icon, Text } from "react-native-paper"
import { primaryColor } from "../layout/constants"
import { gql, useQuery } from "@apollo/client"
import { userFriendlyTime } from "@/lib/utils"
import { AppContext } from "../AppContextProvider"
import NoConversationYet from "./NoConversationYet"
import ResourceImageWithCreator from "../ResourceImageWithAuthor"

export const MY_CONVERSATIONS = gql`query MyConversations {
    myConversations {
      nodes {
        id
        created
        messageByLastMessageId {
          text
          created
        }
        participantsByConversationId {
          nodes {
            id
            unreadMessagesByParticipantId {
              totalCount
            }
            accountsPublicDatumByAccountId {
              id
              name
              imageByAvatarImageId {
                publicId
              }
            }
          }
        }
        resourceByResourceId {
          id
          canBeGifted
          canBeExchanged
          title
          accountsPublicDatumByAccountId {
            name
            id
            imageByAvatarImageId {
              publicId
            }
          }
          resourcesImagesByResourceId {
            nodes {
              imageByImageId {
                publicId
              }
            }
          }
        }
      }
    }
  }`

interface Props {
    onConversationSelected: (resource: Resource, otherAccountId: string) => void
}

const PastConversations = ({ onConversationSelected }: Props) => {
    const appContext = useContext(AppContext)
    const {data, loading, error, refetch} = useQuery(MY_CONVERSATIONS)

    useEffect(() => {
      refetch()
    }, [ appContext.lastConversationChangeTimestamp ])

    return <View style={{ flex: 1 }}>
      <LoadedList loading={loading} data={(data && data.myConversations) ? fromServerGraphConversations(data.myConversations.nodes, appContext.account!.id) : [] as ConversationData[]} 
        error={error} noDataLabel={<NoConversationYet />}
        displayItem={(item, idx) => {
          return <ResponsiveListItem testID={`conversation:${idx}:Button`} key={idx} style={{ paddingLeft: 5, paddingRight: item.conversation.hasUnread ? 4 : 24, borderBottomColor: '#CCC', borderBottomWidth: 1 }} 
            left={() => <ResourceImageWithCreator size={70} resource={item.conversation.resource} authorInfo={item.withUser} />}
            onPress={() => {
              onConversationSelected(item.conversation.resource, item.withUser.id)
            }}
            right={p => <View style={{ flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end'}}>
                { item.conversation.hasUnread && <Icon testID={`conversation:${idx}:UnreadMarker`} size={20} color={primaryColor} source="circle" /> }
                <Text variant="bodySmall" style={{ color: primaryColor, fontWeight: item.conversation.hasUnread ? 'bold' : 'normal' }}>{ item.conversation.lastMessageTime && userFriendlyTime(item.conversation.lastMessageTime) }</Text>
              </View>}
            title={() => <View style={{ flexDirection: 'column' }}>
                <Text testID={`conversation:${idx}:WithUserName`} variant="bodyMedium" style={{ color: primaryColor, fontWeight: 'normal' }}>{ item.withUser.name || t('name_account_removed')}</Text>
                <Text testID={`conversation:${idx}:ResourceTitle`} variant="bodySmall" style={{ fontWeight: 'normal', textTransform: 'uppercase' }}>{item.conversation.resource.title}</Text>
            </View>} description={<Text testID={`conversation:${idx}:LastMessage`} style={{ fontWeight: item.conversation.hasUnread ? 'bold' : 'normal' }}>{item.conversation.lastMessageExcerpt}</Text>} />
        }} />
    </View>
}

export default PastConversations