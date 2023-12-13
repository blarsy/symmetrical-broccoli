import React from "react"
import { View } from "react-native"
import { RouteProps } from "@/lib/utils"
import Conversation from "../Conversation"
import PastConversations from "../PastConversations"
import Images from "@/Images"
import { lightPrimaryColor } from "../layout/constants"

const Chat = ({ route, navigation }: RouteProps) => {
    return <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <Images.BackgroundChat fill={lightPrimaryColor} style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
        />
        { route.params && route.params.resource ? <Conversation resourceId={route.params.resource.id} /> :
            <PastConversations onConversationSelected={resource => navigation.navigate('chat', { resource })} />}
    </View>
}

export default Chat