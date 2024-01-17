import React, { useContext } from "react"
import { View } from "react-native"
import { List, IconButton } from "react-native-paper"
import ListOf from "./ListOf"
import { AppContext } from "./AppContextProvider"
import { useLazyQuery } from "@apollo/client"
import { Resource, fromServerGraphResource } from "@/lib/schema"
import { EditResourceContext } from "./EditResourceContextProvider"
import { GET_RESOURCE } from "@/lib/utils"

interface Props {
    newMessages: any[]
    onRequestConversationOpen: (resource: Resource) => void
    onClose: () => void
}

const NewChatMessages = ({ newMessages, onRequestConversationOpen, onClose }: Props) => {
    const appContext = useContext(AppContext)
    const editedResourceState = useContext(EditResourceContext)
    const [getResource] = useLazyQuery(GET_RESOURCE)

    return <View style={{ flexDirection: 'row', flexWrap: 'nowrap', flex: 1 }}>
        <View style={{ flexDirection: 'column', flex: 1 }}>
            <ListOf data={newMessages} 
                displayItem={(data, idx) => <List.Item key={idx} title={data.participantByParticipantId.accountByAccountId.name} 
                    description={data.text || '<image>'} onPress={async () => {
                        appContext.actions.beginOp()
                        try {
                            const res = await getResource({ variables: { id: data.participantByParticipantId.conversationByConversationId.resourceByResourceId.id } })
                            const resource = fromServerGraphResource(res.data.resourceById, editedResourceState.state.categories.data!)
                            onRequestConversationOpen(resource)
                            appContext.actions.endOp()
                        } catch(e) {
                            appContext.actions.endOpWithError(e)
                        }
                    }} />} />
        </View>
        <IconButton icon="close" onPress={() => onClose()} />
    </View>
}

export default NewChatMessages