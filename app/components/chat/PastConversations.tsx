import { t } from "@/i18n"
import { ConversationData, Resource, fromServerGraphConversations } from "@/lib/schema"
import React, { useContext } from "react"
import { Image, View } from "react-native"
import LoadedList from "../LoadedList"
import ResponsiveListItem from "../ResponsiveListItem"
import { AppContext } from "../AppContextProvider"
import { Text } from "react-native-paper"
import { primaryColor } from "../layout/constants"
import dayjs from "dayjs"
import { urlFromPublicId } from "@/lib/images"
import { gql, useQuery } from "@apollo/client"

const MY_CONVERSATIONS = gql`query MyConversations {
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
    const {data, loading, error} = useQuery(MY_CONVERSATIONS)

    return <View style={{ flex: 1 }}>
        <LoadedList loading={loading} data={(data && data.myConversations) ? fromServerGraphConversations(data.myConversations.nodes, appContext.state.account!.id) : [] as ConversationData[]} error={error} noDataLabel={t('noConversationLoaded_label')}
            displayItem={(item, idx) => {
                const imgSource = (item.conversation.resource.images && item.conversation.resource.images.length > 0) ?
                    { uri: urlFromPublicId(item.conversation.resource.images[0].publicId!)} : 
                    require('@/assets/img/placeholder.png')
                return <ResponsiveListItem style={{ paddingLeft: 5, borderBottomColor: '#000', borderBottomWidth: 1, borderStyle: 'dashed' }} left={() => <Image style={{ width: 50, height: 50 }} source={imgSource} />} key={idx}
                    onPress={() => {
                      onConversationSelected(item.conversation.resource, item.withUser.id)
                    }}
                    title={() => <View style={{ flexDirection: 'column' }}>
                        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text variant="headlineMedium" style={{ color: primaryColor, fontWeight: item.conversation.hasUnread ? 'bold' : 'normal' }}>{ item.withUser.name || t('name_account_removed')}</Text>
                            <Text variant="bodySmall" style={{ color: '#000', fontWeight: item.conversation.hasUnread ? 'bold' : 'normal' }}>{ item.conversation.lastMessageTime && dayjs(item.conversation.lastMessageTime).format(t('dateFormat')) }</Text>
                        </View>
                        <Text variant="bodyMedium" style={{ fontWeight: item.conversation.hasUnread ? 'bold' : 'normal' }}>{item.conversation.resource.title}</Text>
                    </View>} description={item.conversation.lastMessageExcerpt} />
            }} />
    </View>
}

export default PastConversations