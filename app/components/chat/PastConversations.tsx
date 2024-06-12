import { t } from "@/i18n"
import { ConversationData, Resource, fromServerGraphConversations } from "@/lib/schema"
import React, { useContext, useEffect } from "react"
import { Image, View } from "react-native"
import LoadedList from "../LoadedList"
import ResponsiveListItem from "../ResponsiveListItem"
import { AppContext } from "../AppContextProvider"
import { Icon, Text } from "react-native-paper"
import { primaryColor } from "../layout/constants"
import { urlFromPublicId } from "@/lib/images"
import { gql, useQuery } from "@apollo/client"
import { userFriendlyChatTime } from "@/lib/utils"

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
    }, [ appContext.state.lastConversationChangeTimestamp ])

    return <View style={{ flex: 1 }}>
        <LoadedList loading={loading} data={(data && data.myConversations) ? fromServerGraphConversations(data.myConversations.nodes, appContext.state.account!.id) : [] as ConversationData[]} error={error} noDataLabel={t('noConversationLoaded_label')}
            displayItem={(item, idx) => {
                const imgSource = (item.conversation.resource.images && item.conversation.resource.images.length > 0) && item.conversation.resource.images[0].publicId ?
                    { uri: urlFromPublicId(item.conversation.resource.images[0].publicId!)} : 
                    require('@/assets/img/placeholder.png')
                return <ResponsiveListItem style={{ paddingLeft: 5, paddingRight: item.conversation.hasUnread ? 4 : 24, borderBottomColor: '#000', borderBottomWidth: 1 }} 
                    left={() => <Image style={{ width: 50, height: 50 }} source={imgSource} />} key={idx}
                    onPress={() => {
                      onConversationSelected(item.conversation.resource, item.withUser.id)
                    }}
                    right={p => item.conversation.hasUnread ? <View style={{ flexDirection: 'column', justifyContent: 'center' }}><Icon size={20} color={primaryColor} source="circle" /></View> : undefined}
                    title={() => <View style={{ flexDirection: 'column' }}>
                        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text variant="headlineMedium" style={{ color: primaryColor, fontWeight: 'normal' }}>{ item.withUser.name || t('name_account_removed')}</Text>
                            <Text variant="bodySmall" style={{ color: '#000', fontWeight: 'normal' }}>{ item.conversation.lastMessageTime && userFriendlyChatTime(item.conversation.lastMessageTime) }</Text>
                        </View>
                        <Text variant="bodyMedium" style={{ fontWeight: 'normal' }}>{item.conversation.resource.title}</Text>
                    </View>} description={<Text style={{ fontWeight: item.conversation.hasUnread ? 'bold' : 'normal' }}>{item.conversation.lastMessageExcerpt}</Text>} />
            }} />
    </View>
}

export default PastConversations