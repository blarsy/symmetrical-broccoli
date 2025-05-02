import { gql, useQuery } from "@apollo/client"
import LoadedZone from "../scaffold/LoadedZone"
import { Stack, SxProps, Theme, Typography } from "@mui/material"
import { useContext } from "react"
import { AppContext } from "../scaffold/AppContextProvider"
import { maxLength } from "@/lib/utils"
import Link from "next/link"
import { ConversationData } from "./lib"
import ConversationImage from "./ConversationImage"

export const MY_CONVERSATIONS = gql`query MyConversations {
    myConversations {
      nodes {
        id
        created
        messageByLastMessage {
          text
          created
        }
        participantsByConversationId {
          nodes {
            id
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

const getConversationData = (rawConv:any, currentAccountId: number): ConversationData => {
    const rawRes = rawConv.resourceByResourceId
    const rawParticipants = rawConv.participantsByConversationId.nodes
    const otherParticipant = rawParticipants.find((participant: any) => participant.accountByAccountId.id != currentAccountId)

    return {
        id: rawConv.id, accountName: otherParticipant.accountByAccountId.name,
        resourceId: rawRes.id, resourceImagePublicId: rawConv.resourceByResourceId.resourcesImagesByResourceId?.nodes?.length > 0 && rawConv.resourceByResourceId.resourcesImagesByResourceId?.nodes[0].imageByImageId?.publicId,
        resourceName: rawRes.title,
        imagePublicId: otherParticipant.accountByAccountId.imageByAvatarImageId?.publicId, 
        numberOfUnreadMessages: otherParticipant.unreadMessagesByParticipantId.totalCount,
        lastMessage: rawConv.messageByLastMessage?.text,
        lastMessageDate: rawConv.messageByLastMessage?.created
    }
}

interface Props {
    sx?: SxProps<Theme>
    onConversationSelected: (conversationId: number) => void
}


const Conversations = (p: Props) => {
    const { data, loading, error } = useQuery(MY_CONVERSATIONS)
    const appContext = useContext(AppContext)

    return <LoadedZone loading={loading} error={error} containerStyle={[{
      padding: '0.5rem',
      overflow: 'auto'
    }, ...(Array.isArray(p.sx) ? p.sx : [p.sx])]}>
        { data && data.myConversations.nodes.toReversed().map((rawConv: any, idx: number) => {
            const conversationData = getConversationData(rawConv, appContext.account!.id)
            return <Stack key={idx} direction="row" gap="0.5rem" sx={{ cursor: 'pointer' }} onClick={ () => p.onConversationSelected(conversationData.id) }>
                  <ConversationImage accountImagePublicId={conversationData.imagePublicId}
                    accountName={conversationData.accountName} resourceImagePublicId={conversationData.resourceImagePublicId} />
                  <Stack alignSelf="flex-start">
                      <Typography color="primary" variant="overline">{conversationData.accountName || appContext.i18n.translator('deletedAccount')}</Typography>
                      <Typography color="primary" variant="caption">{conversationData.resourceName}</Typography>
                      <Typography color="primary" variant="body1">{ maxLength(conversationData.lastMessage, 50) }</Typography>
                  </Stack>
              </Stack>
        }) }
    </LoadedZone>
}

export default Conversations