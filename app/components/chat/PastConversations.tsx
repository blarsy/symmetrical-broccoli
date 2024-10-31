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
import { ResourceImage } from "../resources/MainResourceImage"

export const MY_CONVERSATIONS = gql`query MyConversations {
    myConversations {
      nodes {
        created
        messageByLastMessage {
          text
          created
        }
        participantsByConversationId {
          nodes {
            unreadMessagesByParticipantId {
              totalCount
            }
            accountByAccountId {
              id
              name
              email
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
          accountByAccountId {
            name
            id
            email
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
    onConversationSelected: (resource: Resource, otherAccountId: number) => void
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
                return <ResponsiveListItem key={idx} style={{ paddingLeft: 5, paddingRight: item.conversation.hasUnread ? 4 : 24, borderBottomColor: '#CCC', borderBottomWidth: 1 }} 
                    left={() => <ResourceImage size={70} resource={item.conversation.resource} key={idx}/>}
                    onPress={() => {
                      onConversationSelected(item.conversation.resource, item.withUser.id)
                    }}
                    right={p => <View style={{ flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end'}}>
                        { item.conversation.hasUnread && <Icon size={20} color={primaryColor} source="circle" /> }
                        <Text variant="bodySmall" style={{ color: primaryColor, fontWeight: item.conversation.hasUnread ? 'bold' : 'normal' }}>{ item.conversation.lastMessageTime && userFriendlyTime(item.conversation.lastMessageTime) }</Text>
                      </View>}
                    title={() => <View style={{ flexDirection: 'column' }}>
                        <Text variant="headlineMedium" style={{ color: primaryColor, fontWeight: 'normal' }}>{ item.withUser.name || t('name_account_removed')}</Text>
                        <Text variant="bodyMedium" style={{ fontWeight: 'normal', textTransform: 'uppercase' }}>{item.conversation.resource.title}</Text>
                    </View>} description={<Text style={{ fontWeight: item.conversation.hasUnread ? 'bold' : 'normal' }}>{item.conversation.lastMessageExcerpt}</Text>} />
            }} />
    </View>
}

export default PastConversations