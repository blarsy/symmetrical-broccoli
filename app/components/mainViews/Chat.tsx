import React, { useEffect, useState } from "react"
import { View } from "react-native"
import { RouteProps } from "@/lib/utils"
import Conversation from "../Conversation"
import PastConversations from "../PastConversations"

const Chat = ({ route, navigation }: RouteProps) => {
    const [conversationId, setConversationId] = useState(null as number|null)
    useEffect(() => {
      if(route.params && route.params.conversationId) {
        setConversationId(route.params.conversationId)
      }
    }, [])
  
    return <View style={{ flex: 1 }}>
      { conversationId ? <Conversation conversationId={conversationId} /> :
          <PastConversations onConversationSelected={conversationId => setConversationId(conversationId)} />}
    </View>
}

export default Chat