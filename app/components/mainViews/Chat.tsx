import React, { useEffect, useState } from "react"
import { View } from "react-native"
import { RouteProps } from "@/lib/utils"
import Conversation from "../Conversation"
import PastConversations from "../PastConversations"

const Chat = ({ route, navigation }: RouteProps) => {
    const [resourceId, setResourceId] = useState(null as number|null)
    useEffect(() => {
      if(route.params && route.params.resourceId) {
        setResourceId(route.params.resourceId)
      }
    }, [])
  
    return <View style={{ flex: 1 }}>
      { resourceId ? <Conversation resourceId={resourceId} /> :
          <PastConversations onConversationSelected={conversationId => setResourceId(conversationId)} />}
    </View>
}

export default Chat