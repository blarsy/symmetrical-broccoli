import React, { useCallback, useEffect, useState } from "react"
import { View } from "react-native"
import { GiftedChat, IMessage, Message } from "react-native-gifted-chat"

export default function Chat () {
    const [messages, setMessages] = useState([] as IMessage[])

    const onSend = useCallback((messages = [] as IMessage[]) => {
        setMessages(previousMessages =>
          GiftedChat.append(previousMessages, messages),
        )
      }, [])

    useEffect(() => {
      setMessages([
        {
          _id: 1,
          text: 'Hello developer',
          createdAt: new Date(),
          user: {
            _id: 2,
            name: 'React Native',
            avatar: 'https://t3.ftcdn.net/jpg/02/48/42/64/360_F_248426448_NVKLywWqArG2ADUxDq6QprtIzsF82dMF.jpg',
          },
        },
      ])
      onSend(messages)
    }, [])
  
    return <View style={{ flex: 1 }}>
            <GiftedChat
                messages={messages}
                onSend={messages => onSend(messages)}
                user={{
                    _id: 1,
                }}
                initialText="Initial"
            />
    </View>
}