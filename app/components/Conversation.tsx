import React, { useCallback, useContext, useEffect, useState } from "react"
import { View } from "react-native"
import { GiftedChat, IMessage, Send } from "react-native-gifted-chat"
import { Icon, IconButton } from "react-native-paper"
import { primaryColor } from "./layout/constants"
import { AppContext } from "./AppContextProvider"
import { gql, useLazyQuery, useMutation } from "@apollo/client"
import { getLanguage, pickImage } from "@/lib/utils"
import { useNavigation } from "@react-navigation/native"
import { uploadImage, urlFromPublicId } from "@/lib/images"
import OperationFeedback from "./OperationFeedback"
import { t } from "i18next"

interface Props {
    resourceId: number
    otherAccountId: number
    otherAccountName: string
}

const asIMessages = (messages: any[]): IMessage[] => messages.map(msg => asIMessage(msg))

const asIMessage = (msg: any): IMessage => ({
    _id: msg.id,
    text: msg.text,
    createdAt: msg.created,
    user: {
        _id: msg.participantByParticipantId.accountByAccountId.id,
        name: msg.participantByParticipantId.accountByAccountId.name,
        avatar: msg.participantByParticipantId.accountByAccountId.imageByAvatarImageId ?
          urlFromPublicId(msg.participantByParticipantId.accountByAccountId.imageByAvatarImageId.publicId):
          undefined
    },
    image: msg.imageByImageId && urlFromPublicId(msg.imageByImageId.publicId),
    pending: false,
    received: !!msg.received,
    sent: true,
})

const CONVERSATION_MESSAGES = gql`query ConversationMessages($resourceId: Int, $otherAccountId: Int) {
    conversationMessages(resourceId: $resourceId, otherAccountId: $otherAccountId) {
      nodes {
        id
        text
        created
        received
        imageByImageId {
          publicId
        }
        participantByParticipantId {
          accountByAccountId {
            id
            name
            imageByAvatarImageId {
              publicId
            }
          }
        }
      }
    }
  }`

const CREATE_MESSAGE = gql`mutation CreateMessage($text: String, $resourceId: Int, $otherAccountId: Int, $imagePublicId: String) {
    createMessage(
      input: {imagePublicId: $imagePublicId, resourceId: $resourceId, otherAccountId: $otherAccountId, text: $text}
    ) {
      integer
    }
  }`

const Conversation = ({ resourceId, otherAccountId, otherAccountName }: Props) => {
    const appContext = useContext(AppContext)
    const navigation = useNavigation()
    const [ getMessages, { loading, error }] = useLazyQuery(CONVERSATION_MESSAGES)
    const [createMessage, { error: createError, reset}] = useMutation(CREATE_MESSAGE)
    const [messages, setMessages] = useState([] as IMessage[])

    const onSend = useCallback(async (newMessages = [] as IMessage[], imagePublicId?: string) => {
        await Promise.all(newMessages.map(message => createMessage({ variables: { 
            text: message.text, 
            resourceId: new Number(resourceId), 
            otherAccountId: new Number(otherAccountId),
            imagePublicId } })))

        setMessages(prevMessages => GiftedChat.append(prevMessages, newMessages))
    }, [messages])

    const loadMessages = async () => {
        const res = await getMessages({ variables: { resourceId: new Number(resourceId), otherAccountId: new Number(otherAccountId) }})

        if(res.data) {
            const loadedMessages = asIMessages(res.data.conversationMessages.nodes)
    
            setMessages(loadedMessages)
            GiftedChat.append([], loadedMessages)
        }
    }

    useEffect(() => {
        loadMessages()
        navigation.addListener('focus', () => appContext.actions.pushMessageReceivedHandler((msg: any) => {
          const receivedMsg = asIMessage(msg)
          setMessages(messages => {
            GiftedChat.append(messages, [receivedMsg])
            return [receivedMsg, ...messages]
          })
        }))
        navigation.addListener('blur', () => appContext.actions.popMessageReceivedHandler())
        return () => {
            appContext.actions.popMessageReceivedHandler()
        }
    }, [ resourceId ])

    const user = {
      _id: appContext.state.account?.id!,
      name: appContext.state.account?.name,
      avatar: appContext.state.account?.avatarPublicId ? urlFromPublicId(appContext.state.account.avatarPublicId) : undefined
    }

    return <View style={{ flex: 1, backgroundColor: 'transparent' }}>
        <GiftedChat
            messages={messages || []}
            alwaysShowSend
            onSend={onSend}
            disableComposer={!otherAccountName}
            placeholder={otherAccountName ? t('type_message_here') : t('cannot_send_to_deleted_account')}
            isLoadingEarlier={loading}
            user={user}
            locale={getLanguage()}
            renderSend={p => <Send {...p} containerStyle={{
                justifyContent: 'center',
                alignItems: 'center',
              }} disabled={!otherAccountName}>
                <Icon color={otherAccountName ? primaryColor : '#777'} source="send" size={35} />
            </Send>}
            renderActions={p => <View style={{ flexDirection: 'row' }}>
                <IconButton size={35} icon="image" disabled={!otherAccountName} iconColor={otherAccountName ? primaryColor : '#777'} style={{ margin: 0 }} onPress={() => pickImage(async img => {
                  const uploadRes = await uploadImage(img.uri)
                  onSend([{
                    _id: 0,
                    text: '',
                    user,
                    image: urlFromPublicId(uploadRes),
                    createdAt: new Date()
                  }], uploadRes)
                }, 400, appContext)} />
            </View>}
        />
        <OperationFeedback error={error || createError} onDismissError={reset} />
    </View>
}

export default Conversation