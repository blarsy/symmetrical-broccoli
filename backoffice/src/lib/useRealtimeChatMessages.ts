import { NewMessage } from "@/components/chat/lib"
import { ChatContext, ChatDispatchContext, ChatReducerActionType } from "@/components/scaffold/ChatContextProvider"
import { gql, useSubscription } from "@apollo/client"
import { useContext, useEffect } from "react"

export const MESSAGE_RECEIVED = gql`subscription MessageReceivedSubscription {
  messageReceived {
    event
    message {
      id
      text
      created
      received
      imageByImageId {
        publicId
      }
      participantByParticipantId {
        id
        accountByAccountId {
          id
          name
          imageByAvatarImageId {
            publicId
          }
        }
        conversationByConversationId {
          id
          resourceByResourceId {
            id
            title
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
    }
  }
}`

function useRealtimeChatMessages() {
    const chatDispatch = useContext(ChatDispatchContext)
    const chatContext = useContext(ChatContext)
    const { data } = useSubscription(MESSAGE_RECEIVED)

    useEffect(() => {
        if(data) {
            if(chatContext.chatMessageCustomHandler) {
                chatContext.chatMessageCustomHandler(data.messageReceived.message)
            }
            
            const rawMessage = data.messageReceived.message
            const newMessage: NewMessage = {
                conversationId: rawMessage.participantByParticipantId.conversationByConversationId.id,
                created: rawMessage.created,
                resourceId: rawMessage.participantByParticipantId.conversationByConversationId.resourceByResourceId.id,
                resourceName: rawMessage.participantByParticipantId.conversationByConversationId.resourceByResourceId.title,
                senderName: rawMessage.participantByParticipantId.accountByAccountId.name,
                text: rawMessage.text,
                image: rawMessage.imageByImageId?.publicId,
                senderImage: rawMessage.participantByParticipantId.accountByAccountId.imageByAvatarImageId?.publicId
            }
            if(rawMessage.participantByParticipantId.conversationByConversationId.resourceByResourceId.resourcesImagesByResourceId?.nodes.length > 0) {
                newMessage.resourceImage = rawMessage.participantByParticipantId.conversationByConversationId.resourceByResourceId.resourcesImagesByResourceId?.nodes[0].imageByImageId.publicId
            }
        
            chatDispatch({ type: ChatReducerActionType.SetNewChatMessage, payload: newMessage })
        }
    }, [data])
}

export default useRealtimeChatMessages