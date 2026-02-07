import React, { useCallback, useContext, useEffect, useState } from "react"
import { ImageSourcePropType } from "react-native"
import { gql, useMutation } from "@apollo/client"
import { RouteProps } from "@/lib/utils"
import { ConversationContext, asIMessage } from "./ConversationContextProvider"
import { useNavigation } from "@react-navigation/native"
import { AppAlertDispatchContext, AppAlertReducerActionType, AppContext, AppDispatchContext, AppReducerActionType } from "../AppContextProvider"
import PanZoomImage from "../PanZoomImage"
import ChatBackground from "./ChatBackground"
import Chat from "./Chat"
import LoadedZone from "../LoadedZone"

export const CREATE_MESSAGE = gql`mutation CreateMessage($text: String, $resourceId: UUID, $otherAccountId: UUID, $imagePublicId: String) {
    createMessage(
      input: {imagePublicId: $imagePublicId, resourceId: $resourceId, otherAccountId: $otherAccountId, text: $text}
    ) {
      uuid
    }
  }`

export const SET_PARTICIPANT_READ = gql`mutation SetParticipantRead($otherAccountId: UUID!, $resourceId: UUID!) {
  setParticipantRead(
    input: {resourceId: $resourceId, otherAccountId: $otherAccountId}
  ) {
    integer
  }
}`

const Conversation = ({ route }: RouteProps) => {
    const appContext = useContext(AppContext)
    const appDispatch = useContext(AppDispatchContext)
    const appAlertDispatch = useContext(AppAlertDispatchContext)
    const conversationContext = useContext(ConversationContext)
    const [focusedImage, setFocusedImage] = useState<ImageSourcePropType | undefined>(undefined)
    const navigation = useNavigation()
    const [setParticipantRead] = useMutation(SET_PARTICIPANT_READ)
    const [createMessage] = useMutation(CREATE_MESSAGE)

    useEffect(() => {
      if(appContext.categories.data) {
        conversationContext.actions.load(route.params?.resourceId, route.params?.otherAccountId, appContext.categories.data)
      }
    }, [route.params, appContext.categories.data])

    const onSend = useCallback(async (newMessage: string, imagePublicId?: string) => {
        if(!newMessage && !imagePublicId) return
        try {

          await createMessage({ variables: { 
              text: newMessage, 
              resourceId: conversationContext.conversationState.data?.resource?.id, 
              otherAccountId: conversationContext.conversationState.data?.otherAccount.id,
              imagePublicId: imagePublicId || undefined } })

          conversationContext.actions.setMessages(prevMessages => [{ 
            createdAt: new Date(), 
            id: undefined, 
            text: newMessage, 
            user: { id: appContext.account!.id, name: appContext.account!.name, avatar: appContext.account!.avatarPublicId },
            image: imagePublicId, 
            received: false,
            sent: true
            }, ...prevMessages])
        } catch(e) {
          appAlertDispatch({ type: AppAlertReducerActionType.DisplayNotification, payload: { error: e as Error} })
        }
    }, [conversationContext.conversationState.data])

    const onMessageReceived = (msg: any) => {
      const receivedMsg = asIMessage(msg)
      conversationContext.actions.setMessages(prevMessages => {
        return [receivedMsg, ...prevMessages]
      })
    }

    const setConversationRead = () => {
      if(conversationContext.conversationState.data?.resource && conversationContext.messagesState.messages.data) {
        setParticipantRead({ variables: { 
            resourceId: conversationContext.conversationState.data?.resource?.id, 
            otherAccountId: conversationContext.conversationState.data?.otherAccount.id
        } })
        appDispatch({ type: AppReducerActionType.SetConversationRead, payload: conversationContext.conversationState.data?.participantId })
      }
    }

    useEffect(() => {
        navigation.addListener('focus', () => {
          appDispatch({ type: AppReducerActionType.SetMessageReceivedHandler, payload: { messageReceivedHandler: onMessageReceived }})
          setConversationRead()
        })
        navigation.addListener('blur', () => appDispatch({ type: AppReducerActionType.SetMessageReceivedHandler, payload: { messageReceivedHandler: undefined } }))
        return () => {
          appDispatch({ type: AppReducerActionType.SetMessageReceivedHandler, payload: { messageReceivedHandler: undefined } })
        }
    }, [])

    useEffect(() => {
      setConversationRead()
    }, [conversationContext.messagesState.messages.data])

    return <ChatBackground>
        <LoadedZone loading={conversationContext.conversationState.loading} 
          error={conversationContext.conversationState.error} 
          containerStyle={{ flex: 1 }}>
          <Chat messages={conversationContext.messagesState.messages} 
            onSend={onSend} otherAccount={conversationContext.conversationState.data!.otherAccount}
            onLoadEarlier={conversationContext.actions.loadEarlier} 
            testID="conversation" 
            loadingEarlier={conversationContext.messagesState.loadingEarlier}
            canLoadEarlier={!!conversationContext.messagesState.endCursor}/>
        </LoadedZone>
        <PanZoomImage source={focusedImage} onDismess={() => setFocusedImage(undefined)} />
    </ChatBackground>
}

export default Conversation