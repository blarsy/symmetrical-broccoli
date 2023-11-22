import { beginOperation, fromData, fromError, initial } from "@/lib/DataLoadState"
import React, { useCallback, useContext, useEffect, useState } from "react"
import { View } from "react-native"
import { GiftedChat, IMessage } from "react-native-gifted-chat"
import { IconButton, Portal, Snackbar } from "react-native-paper"
import { primaryColor } from "./layout/constants"
import { t } from "@/i18n"
import { Message } from "@/lib/schema"
import { AppContext } from "./AppContextProvider"
import { getMessages } from "@/lib/api"

interface Props {
    conversationId: number
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

const Conversation = ({ conversationId }: Props) => {
    const appContext = useContext(AppContext)
    const [messages, setMessages] = useState(initial<IMessage[]>(false, []))

    const onSend = useCallback((newMessages = [] as IMessage[]) => {
        // Send new messages over the connected socket's namespace


        setMessages(fromData(GiftedChat.append(messages.data, newMessages)))
    }, [])

    const loadMessages = async () => {
        try {
            setMessages(beginOperation())
            // connect to this conversation's namespace over the configured socket server


            const messages = await getMessages(appContext.state.token.data!, conversationId)
            
            setMessages(fromData(asIMessages(messages)))
        } catch(e) {
            setMessages(fromError(e, t('requestError')))
        }
    }

    useEffect(() => {
        loadMessages()
    }, [ conversationId ])
    
    return <View style={{ flex: 1 }}>
        <GiftedChat
            messages={messages.data}
            onSend={messages => onSend(messages)}
            isLoadingEarlier={messages.loading}
            user={{
                _id: appContext.state.account?.id!,
                name: appContext.state.account?.name
            }}
            renderSend={() => <IconButton iconColor={primaryColor} icon="send" style={{ margin: 0 }}/>}
            renderActions={p => <View style={{ flexDirection: 'row' }}>
                <IconButton icon="image" iconColor={primaryColor} style={{ margin: 0 }} />
                <IconButton icon="emoticon" iconColor={primaryColor} style={{ margin: 0 }} />
            </View>}
        />
        <Portal>
            <Snackbar visible={!!messages.error} onDismiss={() => setMessages(initial(false, []))}>{messages.error?.message}</Snackbar>
        </Portal>
    </View>
}

export default Conversation