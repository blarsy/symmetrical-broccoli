import { beginOperation, fromData, fromError, initial } from "@/lib/DataLoadState"
import React, { useCallback, useContext, useEffect, useState } from "react"
import { View } from "react-native"
import { GiftedChat, IMessage, Send } from "react-native-gifted-chat"
import { Icon, IconButton, Portal, Snackbar } from "react-native-paper"
import { primaryColor } from "./layout/constants"
import { t } from "@/i18n"
import { Message } from "@/lib/schema"
import { AppContext } from "./AppContextProvider"
import { getMessages, sendChatMessages } from "@/lib/api"
import { NewMessageData } from "@/lib/utils"
import { getLocales } from "expo-localization"

interface Props {
    resourceId: number
}

const asIMessages = (messages: Message[]): IMessage[] => messages.map(msg => asIMessage(msg))

const asIMessage = (msg: Message): IMessage => ({
    _id: msg.id,
    text: msg.text,
    createdAt: msg.created,
    user: {
        _id: msg.from.id,
        name: msg.from.name
    },
    pending: false,
    received: !!msg.received,
    sent: true,
    image: msg.image?.path
})

const Conversation = ({ resourceId }: Props) => {
    const appContext = useContext(AppContext)
    const [messages, setMessages] = useState(initial<{ message: IMessage, resourceId: number }[]>(false, []))

    const onSend = useCallback(async (newMessages = [] as IMessage[]) => {
        await sendChatMessages(appContext.state.token.data!, resourceId, newMessages)

        setMessages(
            fromData(
                GiftedChat.append(messages.data!.map(data => data.message), newMessages)
                    .map((msg: IMessage) => ({ message: msg, resourceId }))))
    }, [messages])

    const appendMessages = (messageList: { message: IMessage, resourceId: number }[]) => {
        setMessages(prevMessages => {
            const fullMessageList = GiftedChat.append(prevMessages.data?.map(msg => msg.message), messageList.map(msg => msg.message))
                .map(msg => ({ message: msg, resourceId}))

            const messagesIAuthored = fullMessageList.filter(msg => msg.message.user._id != appContext.state.account!.id)
            if(messagesIAuthored.length > 0)
                appContext.state.chatSocket!.setLastReadMessage(appContext.state.token.data!, messagesIAuthored[0].message._id as number)
            
            return fromData(fullMessageList)
        })
    }

    const loadMessages = async () => {
        try {
            setMessages(beginOperation())
            
            const messagesPromise = getMessages(appContext.state.token.data!, resourceId)

            const loadedMessages = asIMessages(await messagesPromise).map(msg => ({ message: msg, resourceId }))
            appContext.state.chatSocket!.pushStackChatMessageListener((data: NewMessageData) => {
                if(data.message.from.id != appContext.state.account?.id) {
                    appendMessages([{ message: asIMessage(data.message), resourceId }])
                }
            })

            appendMessages(loadedMessages)
        } catch(e) {
            setMessages(fromError(e, t('requestError')))
        }
    }

    useEffect(() => {
        loadMessages()
        return () => { appContext.state.chatSocket!.popStackChatMessageListener() }
    }, [ resourceId ])
    
    return <View style={{ flex: 1, backgroundColor: 'transparent' }}>
        <GiftedChat
            alwaysShowSend
            messages={messages.data?.map(data => data.message) || []}
            onSend={onSend}
            isLoadingEarlier={messages.loading}
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
            <Snackbar visible={!!messages.error} onDismiss={() => {
                setMessages(initial(false, []))
            }}>{messages.error?.message}</Snackbar>
        </Portal>
    </View>
}

export default Conversation