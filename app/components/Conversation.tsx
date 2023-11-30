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

interface Props {
    resourceId: number
}

const asIMessages = (messages: Message[]): IMessage[] => messages.map(msg => ({
    _id: msg.id,
    text: msg.text,
    createdAt: msg.created,
    user: {
        _id: msg.from.id,
        name: msg.from.name
    },
    pending: false,
    sent: true,
    image: msg.image?.path
}))

const Conversation = ({ resourceId }: Props) => {
    const appContext = useContext(AppContext)
    const [messages, setMessages] = useState(initial<IMessage[]>(false, []))

    const onSend = useCallback(async (newMessages = [] as IMessage[]) => {
        const sentMessages = await sendChatMessages(appContext.state.token.data!, resourceId, newMessages)

        setMessages(fromData(GiftedChat.append(messages.data, newMessages)))
    }, [messages])

    const loadMessages = async () => {
        try {
            setMessages(beginOperation())
            // connect to this conversation's namespace over the configured socket server

            const messages = await getMessages(appContext.state.token.data!, resourceId)
            setMessages(fromData(asIMessages(messages)))
        } catch(e) {
            setMessages(fromError(e, t('requestError')))
        }
    }

    useEffect(() => {
        loadMessages()
    }, [ resourceId ])
    
    return <View style={{ flex: 1, backgroundColor: 'transparent' }}>
        <GiftedChat
            alwaysShowSend
            messages={messages.data || []}
            onSend={onSend}
            isLoadingEarlier={messages.loading}
            user={{
                _id: appContext.state.account?.id!,
                name: appContext.state.account?.name
            }}
            renderSend={p => <Send {...p} containerStyle={{
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Icon color={primaryColor} source="send" size={35} />
            </Send>}
            renderActions={p => <View style={{ flexDirection: 'row' }}>
                <IconButton icon="image" iconColor={primaryColor} style={{ margin: 0 }} />
                <IconButton icon="emoticon" iconColor={primaryColor} style={{ margin: 0 }} />
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