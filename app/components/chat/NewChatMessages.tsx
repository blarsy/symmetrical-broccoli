import React from "react"
import { View } from "react-native"
import { List, IconButton } from "react-native-paper"
import ListOf from "../ListOf"
import Images from "@/Images"

interface Props {
    newMessages: any[]
    onRequestConversationOpen: (resourceId: string, otherAccountId: string, otherAccountName: string) => void
    onClose: () => void
}

const NewChatMessages = ({ newMessages, onRequestConversationOpen, onClose }: Props) => {
    return <View style={{ flexDirection: 'row', flexWrap: 'nowrap', flex: 1 }}>
        <View style={{ flexDirection: 'column', flex: 1 }}>
            <ListOf data={newMessages} 
                displayItem={(data, idx) => <List.Item key={idx} title={data.participantByParticipantId.accountsPublicDatumByAccountId.name} 
                    description={data.text || '<image>'} onPress={() => {
                        onRequestConversationOpen(
                            data.participantByParticipantId.conversationByConversationId.resourceByResourceId.id, 
                            data.participantByParticipantId.accountsPublicDatumByAccountId.id,
                            data.participantByParticipantId.accountsPublicDatumByAccountId.name
                        )
                    }} />} />
        </View>
        <IconButton size={15} icon={p => <Images.Cross fill={p.color}/>} onPress={() => onClose()} />
    </View>
}

export default NewChatMessages