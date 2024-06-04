import React, { useCallback, useContext, useEffect } from "react"
import { View } from "react-native"
import { GiftedChat, IMessage, Send } from "react-native-gifted-chat"
import { Icon, IconButton } from "react-native-paper"
import { primaryColor } from "../layout/constants"
import { gql, useMutation } from "@apollo/client"
import { RouteProps, getLanguage, pickImage } from "@/lib/utils"
import { uploadImage, urlFromPublicId } from "@/lib/images"
import OperationFeedback from "../OperationFeedback"
import { t } from "i18next"
import { ConversationContext, asIMessage } from "./ConversationContextProvider"
import LoadedZone from "../LoadedZone"
import { ChatBackground } from "../mainViews/Chat"
import { useNavigation } from "@react-navigation/native"
import { AppContext, AppDispatchContext, AppReducerActionType } from "../AppStateContext"

export const CREATE_MESSAGE = gql`mutation CreateMessage($text: String, $resourceId: Int, $otherAccountId: Int, $imagePublicId: String) {
    createMessage(
      input: {imagePublicId: $imagePublicId, resourceId: $resourceId, otherAccountId: $otherAccountId, text: $text}
    ) {
      integer
    }
  }`

const Conversation = ({ route }: RouteProps) => {
    const appContext = useContext(AppContext)
    const appDispatch = useContext(AppDispatchContext)
    const conversationContext = useContext(ConversationContext)
    const navigation = useNavigation()
    const [createMessage, { error: createError, reset}] = useMutation(CREATE_MESSAGE)

    useEffect(() => {
      if(appContext.categories.data) {
          conversationContext.actions.load(route.params?.resourceId, route.params?.otherAccountId, appContext.categories.data)
      }
    }, [route.params, appContext.categories.data])

    const onSend = useCallback(async (newMessages = [] as IMessage[], imagePublicId?: string) => {
        await Promise.all(newMessages.map(message => createMessage({ variables: { 
            text: message.text, 
            resourceId: new Number(conversationContext.state.conversation.data?.resource?.id), 
            otherAccountId: new Number(conversationContext.state.conversation.data?.otherAccount.id),
            imagePublicId } })))

        conversationContext.actions.setMessages(prevMessages => GiftedChat.append(prevMessages, newMessages))
    }, [conversationContext.state.conversation.data])

    const onMessageReceived = (msg: any) => {
      const receivedMsg = asIMessage(msg)
      conversationContext.actions.setMessages(messages => {
        GiftedChat.append(messages, [receivedMsg])
        return [receivedMsg, ...messages]
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

    const user = {
      _id: appContext.account?.id!,
      name: appContext.account?.name,
      avatar: appContext.account?.avatarPublicId ? urlFromPublicId(appContext.account.avatarPublicId) : undefined
    }

    return <ChatBackground>
        <LoadedZone containerStyle={{ flex: 1 }} loading={conversationContext.state.conversation.loading} error={conversationContext.state.conversation.error}>
          <View style={{ flex: 1, backgroundColor: 'transparent' }}>
              <GiftedChat
                  messages={conversationContext.state.conversation.data?.messages}
                  alwaysShowSend
                  onSend={onSend}
                  disableComposer={!conversationContext.state.conversation.data?.otherAccount.name}
                  placeholder={conversationContext.state.conversation.data?.otherAccount.name ? t('type_message_here') : t('cannot_send_to_deleted_account')}
                  isLoadingEarlier={conversationContext.state.conversation.loading}
                  user={user}
                  locale={getLanguage()}
                  loadEarlier={!!conversationContext.state.conversation.data?.endCursor}
                  infiniteScroll={true}
                  onLoadEarlier={conversationContext.actions.loadEarlier}
                  renderSend={p => <Send {...p} containerStyle={{
                      justifyContent: 'center',
                      alignItems: 'center',
                    }} disabled={!conversationContext.state.conversation.data?.otherAccount.name}>
                      <Icon color={conversationContext.state.conversation.data?.otherAccount.name ? primaryColor : '#777'} source="send" size={35} />
                  </Send>}
                  renderActions={p => <View style={{ flexDirection: 'row' }}>
                      <IconButton size={35} icon="image" disabled={!conversationContext.state.conversation.data?.otherAccount.name} iconColor={conversationContext.state.conversation.data?.otherAccount.name ? primaryColor : '#777'} style={{ margin: 0 }} onPress={() => pickImage(async img => {
                        try {
                          const uploadRes = await uploadImage(img.uri)
                          onSend([{
                            _id: 0,
                            text: '',
                            user,
                            image: urlFromPublicId(uploadRes),
                            createdAt: new Date()
                          }], uploadRes)
                        } catch (e) {
                          appDispatch({ type: AppReducerActionType.DisplayNotification, payload: { error: e as Error} })
                        }
                      }, 400)} />
                  </View>}
              />
              <OperationFeedback error={conversationContext.state.conversation.error || createError} onDismissError={reset} />
          </View>
        </LoadedZone>
    </ChatBackground>
}

export default Conversation