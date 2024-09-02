import React, { useCallback, useContext, useEffect, useState } from "react"
import { Image, ImageSourcePropType, TouchableOpacity, View } from "react-native"
import Images from "@/Images"
import { GiftedChat, IMessage, Send } from "react-native-gifted-chat"
import { ActivityIndicator, Icon, IconButton, Text } from "react-native-paper"
import { lightPrimaryColor, primaryColor } from "../layout/constants"
import { gql, useMutation } from "@apollo/client"
import { RouteProps, adaptToWidth, getLanguage, pickImage } from "@/lib/utils"
import { imgSourceFromPublicId, uploadImage, urlFromPublicId } from "@/lib/images"
import OperationFeedback from "../OperationFeedback"
import { t } from "i18next"
import { ConversationContext, asIMessage } from "./ConversationContextProvider"
import LoadedZone from "../LoadedZone"
import { useNavigation } from "@react-navigation/native"
import { AppContext, AppDispatchContext, AppReducerActionType } from "../AppContextProvider"
import ChatBackground from "./ChatBackground"
import dayjs from "dayjs"
import PanZoomImage from "../PanZoomImage"

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

const chatImageSize = adaptToWidth(130, 250, 400)

const Conversation = ({ route }: RouteProps) => {
    const appContext = useContext(AppContext)
    const appDispatch = useContext(AppDispatchContext)
    const conversationContext = useContext(ConversationContext)
    const [focusedImage, setFocusedImage] = useState<ImageSourcePropType | undefined>(undefined)
    const [sending, setSending] = useState(false)
    const navigation = useNavigation()
    const [setParticipantRead] = useMutation(SET_PARTICIPANT_READ)
    const [createMessage, { error: createError, reset}] = useMutation(CREATE_MESSAGE)

    useEffect(() => {
      if(appContext.categories.data) {
          conversationContext.actions.load(route.params?.resourceId, route.params?.otherAccountId, appContext.categories.data)
      }
    }, [route.params, appContext.categories.data])

    const onSend = useCallback(async (newMessages = [] as IMessage[], imagePublicId?: string) => {
        setSending(true)
        try {
          await Promise.all(newMessages.map(message => createMessage({ variables: { 
              text: message.text, 
              resourceId: new Number(conversationContext.state.conversation.data?.resource?.id), 
              otherAccountId: new Number(conversationContext.state.conversation.data?.otherAccount.id),
              imagePublicId } })))
  
          conversationContext.actions.setMessages(prevMessages => GiftedChat.append(prevMessages, newMessages))
        } finally {
          setSending(false)
        }
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

    useEffect(() => {
      if(conversationContext.state.conversation.data?.resource) {
        setParticipantRead({ variables: { 
          resourceId: conversationContext.state.conversation.data?.resource?.id, 
          otherAccountId: conversationContext.state.conversation.data?.otherAccount.id
         } })
         appDispatch({ type: AppReducerActionType.SetConversationRead, payload: conversationContext.state.conversation.data?.participantId })
      }
    }, [conversationContext.state.conversation.data?.messages])

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
                  renderLoadEarlier={p => <View style={{ alignItems: 'center' }}>
                    <IconButton icon="arrow-up" style={{ margin: 0, padding: 0 }} onPress={p.onLoadEarlier} mode="contained" />
                  </View>}
                  renderSend={p => <Send {...p} containerStyle={{
                      justifyContent: 'center',
                      alignItems: 'center',
                    }} textStyle={{ color: primaryColor }} disabled={!conversationContext.state.conversation.data?.otherAccount.name || sending}>
                      <View style={{ flexDirection: 'row' }}>
                        {sending && <ActivityIndicator color={primaryColor}/>}
                        <Icon color={conversationContext.state.conversation.data?.otherAccount.name ? primaryColor : '#777'} source="send" size={35} />
                      </View>
                  </Send>}
                  renderMessage={p => {
                    const fromOther = p.currentMessage?.user._id != p.user._id
                    return <View style={{ flex: 1, alignItems: fromOther ? 'flex-start': 'flex-end', gap: 5 }}>
                      { p.previousMessage && dayjs(p.previousMessage.createdAt).format('DDMMYYYY') != dayjs(p.currentMessage?.createdAt).format('DDMMYYYY') && <Text variant="bodySmall" style={{ alignSelf: 'center', color: primaryColor, fontWeight: 'bold' }}>{dayjs(p.currentMessage?.createdAt).format('ddd DD, YY')}</Text> }
                      <View style={{ flexDirection: 'column', backgroundColor: fromOther ? lightPrimaryColor : primaryColor, padding: 15,
                          borderRadius: 15, margin: 5, alignItems: fromOther ? 'flex-start': 'flex-end'
                       }}>
                        { p.currentMessage?.image && <TouchableOpacity onPress={() => setFocusedImage(imgSourceFromPublicId(p.currentMessage!.image!))}>
                          <Image style={{ width: chatImageSize, height: chatImageSize, borderRadius: 10 }} source={imgSourceFromPublicId(p.currentMessage?.image)} />
                        </TouchableOpacity> }
                        <Text variant="displayMedium">{p.currentMessage?.text}</Text>
                        <Text variant="bodySmall" style={{ marginTop: 5 }}>{dayjs(p.currentMessage?.createdAt).format('HH:mm')}</Text>
                      </View>
                    </View>}}
                  renderActions={p => <View style={{ flexDirection: 'row', paddingLeft: 5 }}>
                      <IconButton size={35} icon={ p => <Images.Photos fill={p.color}/>} disabled={!conversationContext.state.conversation.data?.otherAccount.name} 
                        iconColor={conversationContext.state.conversation.data?.otherAccount.name ? primaryColor : '#777'} 
                        style={{ margin: 0, borderRadius: 0 }} onPress={() => pickImage(async img => {
                        setSending(true)
                        try {
                          const uploadRes = await uploadImage(img.uri)
                          onSend([{
                            _id: 0,
                            text: '',
                            user,
                            image: uploadRes,
                            createdAt: new Date()
                          }], uploadRes)
                        } catch (e) {
                          appDispatch({ type: AppReducerActionType.DisplayNotification, payload: { error: e as Error} })
                        } finally {
                          setSending(false)
                        }
                      }, 400)} />
                  </View>}
              />
              <OperationFeedback error={conversationContext.state.conversation.error || createError} onDismissError={reset} />
          </View>
          <PanZoomImage source={focusedImage} onDismess={() => setFocusedImage(undefined)} />
        </LoadedZone>
    </ChatBackground>
}

export default Conversation