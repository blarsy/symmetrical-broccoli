import React, { useEffect, useState } from "react"
import { View } from "react-native"
import { RouteProps } from "@/lib/utils"
import Conversation from "../Conversation"
import PastConversations from "../PastConversations"
import { Resource } from "@/lib/schema"
import Images from "@/Images"
import { lightPrimaryColor, primaryColor } from "../layout/constants"

const Chat = ({ route, navigation }: RouteProps) => {
    const [resource, setResource] = useState(undefined as Resource | undefined)
    useEffect(() => {
      if(route.params && route.params.resource) {
        setResource(route.params.resource)
      }
    }, [route.params && route.params.resource])
    return <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <Images.BackgroundChat fill={lightPrimaryColor} style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
        />
        { resource ? <Conversation resourceId={resource.id} /> :
            <PastConversations onConversationSelected={resource => setResource(resource)} />}
    </View>
}

export default Chat