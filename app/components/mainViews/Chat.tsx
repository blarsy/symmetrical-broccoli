import React, { useContext } from "react"
import { View } from "react-native"
import { RouteProps, fontSizeMedium } from "@/lib/utils"
import Conversation from "../chat/Conversation"
import PastConversations from "../chat/PastConversations"
import { primaryColor } from "../layout/constants"
import { NativeStackHeaderProps, createNativeStackNavigator } from "@react-navigation/native-stack"
import { ResourceImage } from "../resources/MainResourceImage"
import { Button, Icon, Text } from "react-native-paper"
import { t } from "@/i18n"
import LoadedZone from "../LoadedZone"
import ConversationContextProvider, { ConversationContext } from "../chat/ConversationContextProvider"
import dayjs from "dayjs"
import { AppContext } from "../AppContextProvider"
import ChatBackground from "../chat/ChatBackground"

interface ChatHeaderProps extends NativeStackHeaderProps {
    goBack?: () => void
}

export const ChatHeader = (p: ChatHeaderProps) => {
    const appContext = useContext(AppContext)
    const conversationContext = useContext(ConversationContext)
    const exchangeTypes: string[] = []
    
    if(conversationContext.state.conversation.data && appContext.categories.data) {
        if(conversationContext.state.conversation.data.resource?.canBeGifted) exchangeTypes.push(t('canBeGifted_label'))
        if(conversationContext.state.conversation.data.resource?.canBeExchanged) exchangeTypes.push(t('canBeExchanged_label'))
    }

    const resourceDeleted = conversationContext.state.conversation.data?.resource?.deleted
    
    return (<LoadedZone loading={conversationContext.state.conversation.loading} error={conversationContext.state.conversation.error} containerStyle={{ flexDirection: 'row', justifyContent:'space-between', alignItems: 'center' }}>
        <Button textColor={primaryColor} icon={p => <Icon size={p.size} source="chevron-left" color={p.color} /> }
            onPress={() => p.goBack ? p.goBack() : p.navigation.goBack() }>{t('back_label')}</Button>
        {conversationContext.state.conversation.data?.resource ? <View style={{ flexDirection: 'column' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ResourceImage size={70} resource={conversationContext.state.conversation.data.resource} />
                <View style={{ flexDirection: 'column', padding: 6, gap: 2 }}>
                    <Text variant="headlineMedium" style={{ color: primaryColor, textTransform: 'uppercase' }}><Icon size={fontSizeMedium} color={primaryColor} source="account-circle" /> {conversationContext.state.conversation.data.resource.account!.name || t('name_account_removed')}</Text>
                    <Text variant="headlineMedium" style={{ textTransform: 'uppercase', textDecorationLine: resourceDeleted ? 'line-through' : 'none' }}>{conversationContext.state.conversation.data.resource.title}</Text>
                    <Text variant="headlineMedium" style={{ color: primaryColor, textTransform: 'uppercase' }}>{exchangeTypes.join('/')}</Text>
                </View>
            </View>
            { resourceDeleted && <Text variant="headlineSmall">{t('resource_deleted', { deleted: dayjs(resourceDeleted).format(t('dateFormat')) })}</Text> }
        </View>
        : <></>}
    </LoadedZone>)
}

const ConversationsList = ({ route, navigation }: RouteProps) => {
    const appContext = useContext(AppContext)
    if(appContext.account) {
        return <ChatBackground>
            <PastConversations onConversationSelected={(resource, otherAccountId) => navigation.navigate('conversation', { resourceId: resource.id, otherAccountId })} />
        </ChatBackground>
    } else {
        return <Text style={{ textAlign: 'center', textTransform: 'uppercase', margin:10 }}>{t('connect_to_chat')}</Text>
    }
}

const StackNav = createNativeStackNavigator()

const Chat = ({ route, navigation }: RouteProps) => {
    return <ConversationContextProvider>
        <StackNav.Navigator screenOptions={{ contentStyle: { backgroundColor: '#fff' } }}>
            <StackNav.Screen name="conversationsList" key="conversationsList" component={ConversationsList} options={{ headerShown: false }} />
            <StackNav.Screen name="conversation" key="conversation" options={{ header: p => <ChatHeader {...p} goBack={() => p.navigation.navigate('conversationsList')} /> }} component={Conversation} />
        </StackNav.Navigator>
    </ConversationContextProvider>
}

export default Chat