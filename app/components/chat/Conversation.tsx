import React, { useCallback, useContext, useEffect, useState } from "react"
import { ImageSourcePropType } from "react-native"
import { gql, useMutation } from "@apollo/client"
import { RouteProps } from "@/lib/utils"
import { ConversationContext, asIMessage } from "./ConversationContextProvider"
import { useNavigation } from "@react-navigation/native"
import { AppContext, AppDispatchContext, AppReducerActionType } from "../AppContextProvider"
import OperationFeedback from "../OperationFeedback"
import PanZoomImage from "../PanZoomImage"
import ChatBackground from "./ChatBackground"
import Chat from "./Chat"
import { initial } from "@/lib/DataLoadState"

export const CREATE_MESSAGE = gql`mutation CreateMessage($text: String, $resourceId: Int, $otherAccountId: Int, $imagePublicId: String) {
    createMessage(
      input: {imagePublicId: $imagePublicId, resourceId: $resourceId, otherAccountId: $otherAccountId, text: $text}
    ) {
      integer
    }
  }`

export const SET_PARTICIPANT_READ = gql`mutation SetParticipantRead($otherAccountId: Int!, $resourceId: Int!) {
  setParticipantRead(
    input: {resourceId: $resourceId, otherAccountId: $otherAccountId}
  ) {
    integer
  }
}`

const Conversation = ({ route }: RouteProps) => {
    const appContext = useContext(AppContext)
    const appDispatch = useContext(AppDispatchContext)
    const conversationContext = useContext(ConversationContext)
    const [focusedImage, setFocusedImage] = useState<ImageSourcePropType | undefined>(undefined)
    const navigation = useNavigation()
    const [setParticipantRead] = useMutation(SET_PARTICIPANT_READ)
    const [createMessage, { error: createError, reset}] = useMutation(CREATE_MESSAGE)

    useEffect(() => {
      if(appContext.categories.data) {
          conversationContext.actions.load(route.params?.resourceId, route.params?.otherAccountId, appContext.categories.data)
      }
    }, [route.params, appContext.categories.data])

    const onSend = useCallback(async (newMessage: string, imagePublicId?: string) => {
          await createMessage({ variables: { 
              text: newMessage, 
              resourceId: new Number(conversationContext.consversationState.data?.resource?.id), 
              otherAccountId: new Number(conversationContext.consversationState.data?.otherAccount.id),
              imagePublicId } })
  
          conversationContext.actions.setMessages(prevMessages => [{ 
            createdAt: new Date(), 
            id: -1, 
            text: newMessage, 
            user: { id: appContext.account!.id, name: appContext.account!.name, avatar: appContext.account!.avatarPublicId },
            image: imagePublicId, 
            received: false,
            sent: true
           }, ...prevMessages])
    }, [conversationContext.consversationState.data])

    const onMessageReceived = (msg: any) => {
      const receivedMsg = asIMessage(msg)
      conversationContext.actions.setMessages(prevMessages => {
        return [receivedMsg, ...prevMessages]
      })
    }

    useEffect(() => {
        navigation.addListener('focus', () => {
          appDispatch({ type: AppReducerActionType.SetMessageReceivedHandler, payload: { messageReceivedHandler: onMessageReceived }})
        })
        navigation.addListener('blur', () => appDispatch({ type: AppReducerActionType.SetMessageReceivedHandler, payload: { messageReceivedHandler: undefined } }))
        return () => {
          appDispatch({ type: AppReducerActionType.SetMessageReceivedHandler, payload: { messageReceivedHandler: undefined } })
        }
    }, [])

    useEffect(() => {
      if(conversationContext.consversationState.data?.resource && conversationContext.messagesState.messages.data) {
        setParticipantRead({ variables: { 
          resourceId: conversationContext.consversationState.data?.resource?.id, 
          otherAccountId: conversationContext.consversationState.data?.otherAccount.id
         } })
         appDispatch({ type: AppReducerActionType.SetConversationRead, payload: conversationContext.consversationState.data?.participantId })
      }
    }, [conversationContext.messagesState.messages.data])

    return <ChatBackground>
        <Chat messages={conversationContext.messagesState.messages ? conversationContext.messagesState.messages : initial(true, [])} 
          onSend={onSend} otherAccount={conversationContext.consversationState.data!.otherAccount}
          onLoadEarlier={conversationContext.actions.loadEarlier} 
          testID="conversation" 
          loadingEarlier={conversationContext.messagesState.messages ? conversationContext.messagesState.messages.loading: false}
          canLoadEarlier={!!conversationContext.messagesState.endCursor}/>
        <OperationFeedback testID="conversationFeedback" error={conversationContext.consversationState.error || createError} onDismissError={reset} />
        <PanZoomImage source={focusedImage} onDismess={() => setFocusedImage(undefined)} />
    </ChatBackground>
}

export default Conversation