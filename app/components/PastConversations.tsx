import { t } from "@/i18n"
import { fromData, fromError, initial } from "@/lib/DataLoadState"
import { ConversationData, Resource } from "@/lib/schema"
import React, { useContext, useEffect } from "react"
import { useState } from "react"
import { View } from "react-native"
import LoadedList from "./LoadedList"
import ResponsiveListItem from "./ResponsiveListItem"
import { AppContext } from "./AppContextProvider"
import { getPastConversations } from "@/lib/api"
import { Icon, Text } from "react-native-paper"
import { primaryColor } from "./layout/constants"

interface Props {
    onConversationSelected: (resource: Resource) => void
}

const PastConversations = ({ onConversationSelected }: Props) => {
    const appContext = useContext(AppContext)
    const [conversations, setConversations] = useState(initial<ConversationData[]>(true, []))

    useEffect(() => {
        const load = async () => {
            try {
                const conversations = await getPastConversations(appContext.state.token.data!)
                setConversations(fromData(conversations)) 
            } catch (e) {
                setConversations(fromError(e, t('requestError')))
            }
        }
        load()
    }, [])

    return <View style={{ flex: 1 }}>
        <LoadedList loading={conversations.loading} data={conversations.data} error={conversations.error} noDataLabel={t('noConversationLoaded_label')}
            displayItem={(item, idx) => <ResponsiveListItem left={() => <Icon size={40} source="account" color={primaryColor} />} key={idx}
                onPress={() => onConversationSelected(item.conversation.resource)}
                title={() => <View style={{ flexDirection: 'column' }}>
                    <Text variant="headlineMedium" style={{ color: primaryColor, fontWeight: item.conversation.hasUnread ? 'bold' : 'normal' }}>{ item.withUser.name }</Text>
                    <Text variant="bodyMedium" style={{ fontWeight: item.conversation.hasUnread ? 'bold' : 'normal' }}>{item.conversation.resource.title}</Text>
                </View>} description={item.conversation.lastMessageExcerpt} />} />
    </View>
}

export default PastConversations