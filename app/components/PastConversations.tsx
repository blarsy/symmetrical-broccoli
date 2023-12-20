import { t } from "@/i18n"
import { fromData, fromError, initial } from "@/lib/DataLoadState"
import { ConversationData, Resource } from "@/lib/schema"
import React, { useContext, useEffect } from "react"
import { useState } from "react"
import { Image, View } from "react-native"
import LoadedList from "./LoadedList"
import ResponsiveListItem from "./ResponsiveListItem"
import { AppContext } from "./AppContextProvider"
import { getPastConversations } from "@/lib/api"
import { Text } from "react-native-paper"
import { primaryColor } from "./layout/constants"
import { imgUrl } from "@/lib/settings"
import dayjs from "dayjs"

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
            displayItem={(item, idx) => {
                const imgSource = (item.conversation.resource.images && item.conversation.resource.images.length > 1) ?
                    { uri: `${imgUrl}${item.conversation.resource.images[0].path}` } : 
                    require('@/assets/img/placeholder.png')
                return <ResponsiveListItem style={{ paddingLeft: 5, borderBottomColor: '#000', borderBottomWidth: 1, borderStyle: 'dashed' }} left={() => <Image style={{ width: 50, height: 50 }} source={imgSource} />} key={idx}
                    onPress={() => onConversationSelected(item.conversation.resource)}
                    title={() => <View style={{ flexDirection: 'column' }}>
                        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text variant="headlineMedium" style={{ color: primaryColor, fontWeight: item.conversation.hasUnread ? 'bold' : 'normal' }}>{ item.withUser.name }</Text>
                            <Text variant="bodySmall" style={{ color: '#000', fontWeight: item.conversation.hasUnread ? 'bold' : 'normal' }}>{ item.conversation.lastMessageTime && dayjs(item.conversation.lastMessageTime).format(t('dateFormat')) }</Text>
                        </View>
                        <Text variant="bodyMedium" style={{ fontWeight: item.conversation.hasUnread ? 'bold' : 'normal' }}>{item.conversation.resource.title}</Text>
                    </View>} description={item.conversation.lastMessageExcerpt} />
            }} />
    </View>
}

export default PastConversations