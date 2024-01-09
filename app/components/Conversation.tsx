import React, { useCallback, useContext, useEffect, useState } from "react"
import { View } from "react-native"
import { GiftedChat, IMessage, Send } from "react-native-gifted-chat"
import { Icon, Portal, Snackbar } from "react-native-paper"
import { primaryColor } from "./layout/constants"
import { AppContext } from "./AppContextProvider"
import { getLocales } from "expo-localization"
import { gql, useLazyQuery, useMutation } from "@apollo/client"

interface Props {
    resourceId: number
}

const asIMessages = (messages: any[]): IMessage[] => messages.map(msg => asIMessage(msg))

const asIMessage = (msg: any): IMessage => ({
    _id: msg.id,
    text: msg.text,
    createdAt: msg.created,
    user: {
        _id: msg.participantByParticipantId.accountByAccountId.id,
        name: msg.participantByParticipantId.accountByAccountId.name
    },
    pending: false,
    received: !!msg.received,
    sent: true,
    image: undefined //TODO
})

const CONVERSATION_MESSAGES = gql`query ConversationMessages($resourceId: Int) {
    conversationMessages(resourceId: $resourceId) {
      nodes {
        id
        text
        created
        received
        participantByParticipantId {
          accountByAccountId {
            id
            name
          }
        }
      }
    }
  }`

const CREATE_MESSAGE = gql`mutation CreateMessage($text: String, $resourceId: Int, $imagePublicId: String) {
    createMessage(
      input: {imagePublicId: $imagePublicId, resourceId: $resourceId, text: $text}
    ) {
      integer
    }
  }`

const Conversation = ({ resourceId }: Props) => {
    const appContext = useContext(AppContext)
    const [ getMessages, { loading, error }] = useLazyQuery(CONVERSATION_MESSAGES)
    const [createMessage, { error: createError, loading: creating}] = useMutation(CREATE_MESSAGE)
    const [messages, setMessages] = useState([] as IMessage[])

    const onSend = useCallback(async (newMessages = [] as IMessage[]) => {
        await Promise.all(newMessages.map(message => createMessage({ variables: { text: message.text, resourceId, imagePublicId: message.image } })))

        setMessages(prevMessages => GiftedChat.append(prevMessages, newMessages))
    }, [messages])

    const loadMessages = async () => {
        const res = await getMessages({ variables: { resourceId }})

        if(res.data) {
            const loadedMessages = asIMessages(res.data.conversationMessages.nodes)
    
            setMessages(loadedMessages)
            GiftedChat.append([], loadedMessages)
        }
    }

    useEffect(() => {
        loadMessages()
        // return () => { appContext.state.chatSocket!.popStackChatMessageListener() }
    }, [ resourceId ])
    
    return <View style={{ flex: 1, backgroundColor: 'transparent', paddingBottom: 20 }}>
        <GiftedChat
            messages={messages || []}
            alwaysShowSend
            onSend={onSend}
            isLoadingEarlier={loading}
            user={{
                _id: appContext.state.account?.id!,
                name: appContext.state.account?.name
            }}
            locale={getLocales()[0].languageCode}
            renderSend={p => <Send {...p} containerStyle={{
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Icon color={primaryColor} source="send" size={35} />
            </Send>}
            renderActions={p => <View style={{ flexDirection: 'row' }}>
                {/* <IconButton icon="image" iconColor={primaryColor} style={{ margin: 0 }} /> */}
                {/* <IconButton icon="emoticon" iconColor={primaryColor} style={{ margin: 0 }} /> */}
            </View>}
        />
        <Portal>
            <Snackbar visible={!!error || !!createError} onDismiss={() => {}}>{(error && error.message) || (createError && createError.message)}</Snackbar>
        </Portal>
    </View>
}

export default Conversation