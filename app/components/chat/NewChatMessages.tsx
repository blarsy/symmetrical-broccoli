import React from "react"
import { View } from "react-native"
import { List, IconButton } from "react-native-paper"
import ListOf from "../ListOf"

interface Props {
    newMessages: any[]
    onRequestConversationOpen: (resourceId: number, otherAccountId: number, otherAccountName: string) => void
    onClose: () => void
}

const NewChatMessages = ({ newMessages, onRequestConversationOpen, onClose }: Props) => {
    return <View style={{ flexDirection: 'row', flexWrap: 'nowrap', flex: 1 }}>
        <View style={{ flexDirection: 'column', flex: 1 }}>
            <ListOf data={newMessages} 
                displayItem={(data, idx) => <List.Item key={idx} title={data.participantByParticipantId.accountByAccountId.name} 
                    description={data.text || '<image>'} onPress={() => {
                        onRequestConversationOpen(
                            data.participantByParticipantId.conversationByConversationId.resourceByResourceId.id, 
                            data.participantByParticipantId.accountByAccountId.id,
                            data.participantByParticipantId.accountByAccountId.name
                        )
                    }} />} />
        </View>
        <IconButton icon="close" onPress={() => onClose()} />
    </View>
}

export default NewChatMessages