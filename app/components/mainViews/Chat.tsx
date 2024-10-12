import React, { useContext } from "react"
import { Dimensions, View } from "react-native"
import { RouteProps, fontSizeMedium } from "@/lib/utils"
import Conversation from "../chat/Conversation"
import PastConversations from "../chat/PastConversations"
import { lightPrimaryColor, primaryColor } from "../layout/constants"
import { NativeStackHeaderProps, createNativeStackNavigator } from "@react-navigation/native-stack"
import { Icon, IconButton, Text } from "react-native-paper"
import { t } from "@/i18n"
import LoadedZone from "../LoadedZone"
import ConversationContextProvider, { ConversationContext } from "../chat/ConversationContextProvider"
import dayjs from "dayjs"
import { AppContext } from "../AppContextProvider"
import ChatBackground from "../chat/ChatBackground"
import AccountAvatar from "./AccountAvatar"
import Images from "@/Images"
import NoConversationYet from "../chat/NoConversationYet"
import BareIconButton from "../layout/BareIconButton"
import { ResourceImage } from "../resources/MainResourceImage"

interface ChatHeaderProps extends NativeStackHeaderProps {
    goBack?: () => void
    onResourceShowRequested: (id: number) => void
    onAccountShowRequested: (id: number) => void
}

export const ChatHeader = (p: ChatHeaderProps) => {
    const conversationContext = useContext(ConversationContext)

    const resourceDeleted = conversationContext.state.conversation.data?.resource?.deleted
    
    return (<LoadedZone loading={conversationContext.state.conversation.loading} error={conversationContext.state.conversation.error}
        containerStyle={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', 
            backgroundColor: lightPrimaryColor, maxWidth: Dimensions.get('window').width, paddingVertical: 5 }}>
            { conversationContext.state.conversation.data?.resource && <>
                <BareIconButton Image="chevron-left" size={40} onPress={() => p.goBack ? p.goBack() : p.navigation.goBack() }/>
                <View style={{ position: 'relative', width: 60, height: 60 }}>
                    <ResourceImage size={ 50 } resource={conversationContext.state.conversation.data!.resource} />
                    <AccountAvatar style={{ position: 'absolute', top: -30, left: 20 }} 
                        onPress={p.onAccountShowRequested} 
                        account={conversationContext.state.conversation.data!.otherAccount} size={40} />
                </View>
                <View style={{ flexShrink: 1, flexGrow: 1, flexDirection: 'column', padding: 6 }}>
                    <Text numberOfLines={1} ellipsizeMode="tail" variant="headlineMedium" 
                        style={{ color: primaryColor, textTransform: 'uppercase' }}>
                        <Icon size={fontSizeMedium} color={primaryColor} source="account-circle" /> {conversationContext.state.conversation.data!.otherAccount.name || t('name_account_removed')}</Text>
                    <Text numberOfLines={1} ellipsizeMode="tail" variant="headlineMedium" 
                        style={{ textDecorationLine: resourceDeleted ? 'line-through' : 'none' }}>
                            {conversationContext.state.conversation.data!.resource?.title}</Text>
                    { resourceDeleted && <Text variant="headlineSmall">{t('resource_deleted', { deleted: dayjs(resourceDeleted).format(t('dateFormat')) })}</Text> }
                </View>
                <IconButton style={{ borderRadius: 0 }} icon={() =>  <Images.Search />} onPress={() => p.onResourceShowRequested(conversationContext.state.conversation.data!.resource!.id)} />
            </>}
    </LoadedZone>)
}

const ConversationsList = ({ route, navigation }: RouteProps) => {
    const appContext = useContext(AppContext)
    if(appContext.account) {
        return <ChatBackground>
            <PastConversations onConversationSelected={(resource, otherAccountId) => navigation.navigate('conversation', { resourceId: resource.id, otherAccountId })} />
        </ChatBackground>
    } else {
        return <NoConversationYet />
    }
}

const StackNav = createNativeStackNavigator()

const Chat = ({ route, navigation }: RouteProps) => {
    return <ConversationContextProvider>
        <StackNav.Navigator screenOptions={{ contentStyle: { backgroundColor: '#fff' } }}>
            <StackNav.Screen name="conversationsList" key="conversationsList" component={ConversationsList} options={{ headerShown: false }} />
            <StackNav.Screen name="conversation" key="conversation" options={{ header: p => <ChatHeader {...p} 
                    goBack={() => p.navigation.navigate('conversationsList')} 
                    onResourceShowRequested={id => p.navigation.navigate('viewResource', { resourceId: id })}
                    onAccountShowRequested={id => p.navigation.navigate('viewAccount', { id })} /> }}
                component={Conversation} />
        </StackNav.Navigator>
    </ConversationContextProvider>
}

export default Chat