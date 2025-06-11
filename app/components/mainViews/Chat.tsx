import React, { useContext, useState } from "react"
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
import Images from "@/Images"
import NoConversationYet from "../chat/NoConversationYet"
import BareIconButton from "../layout/BareIconButton"
import SimpleBackHeader from "../layout/SimpleBackHeader"
import ViewAccount from "./ViewAccount"
import ViewResource from "../resources/ViewResource"
import ResourceImageWithCreator from "../ResourceImageWithAuthor"
import SendTokensDialog from "../account/SendTokensDialog"

interface ChatHeaderProps extends NativeStackHeaderProps {
    goBack?: () => void
    onResourceShowRequested: (id: number) => void
    onAccountShowRequested: (id: number) => void
}

export const ChatHeader = (p: ChatHeaderProps) => {
    const appContext = useContext(AppContext)
    const conversationContext = useContext(ConversationContext)
    const [sendingTokensTo, setSendingTokensTo] = useState<number | undefined>()

    const resourceDeleted = conversationContext.conversationState.data?.resource?.deleted
    
    return (<LoadedZone loading={conversationContext.conversationState.loading} error={conversationContext.conversationState.error}
        containerStyle={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', 
            backgroundColor: lightPrimaryColor, maxWidth: Dimensions.get('window').width, paddingVertical: 5 }} loadIndicatorColor={primaryColor}>
            { conversationContext.conversationState.data?.resource && <>
                <BareIconButton testID="backToConversationList" Image="chevron-left" size={40} onPress={() => p.goBack ? p.goBack() : p.navigation.goBack() }/>
                <ResourceImageWithCreator authorInfo={conversationContext.conversationState.data!.otherAccount}
                    resource={conversationContext.conversationState.data!.resource} onAccountPress={p.onAccountShowRequested} />
                <View style={{ flexShrink: 1, flexGrow: 1, flexDirection: 'column', padding: 6 }}>
                    <Text numberOfLines={1} ellipsizeMode="tail" variant="headlineMedium" 
                        style={{ color: primaryColor, textTransform: 'uppercase' }}>
                        <Icon size={fontSizeMedium} color={primaryColor} source="account-circle" /> {conversationContext.conversationState.data!.otherAccount.name || t('name_account_removed')}</Text>
                    <Text numberOfLines={1} ellipsizeMode="tail" variant="headlineMedium" 
                        style={{ textDecorationLine: resourceDeleted ? 'line-through' : 'none' }}>
                            {conversationContext.conversationState.data!.resource?.title}</Text>
                    { resourceDeleted && <Text variant="headlineSmall">{t('resource_deleted', { deleted: dayjs(resourceDeleted).format(t('dateFormat')) })}</Text> }
                </View>
                <IconButton style={{ borderRadius: 0 }} icon={Images.Search} onPress={() => p.onResourceShowRequested(conversationContext.conversationState.data!.resource!.id)} />
                { conversationContext.conversationState.data.otherAccount.willingToContribute && appContext.account && 
                    <IconButton style={{ borderRadius: 0 }} size={40} iconColor="#000" 
                        icon="hand-coin" 
                        onPress={() => setSendingTokensTo(conversationContext.conversationState.data!.otherAccount.id)} /> }
            </>}
        <SendTokensDialog toAccount={sendingTokensTo} accountName={conversationContext.conversationState.data!.otherAccount.name} 
            onDismiss={() => setSendingTokensTo(undefined)} />
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
            <StackNav.Screen name="viewAccount" key="viewAccount" options={{ headerShown: true, header: SimpleBackHeader }} component={ViewAccount} />
            <StackNav.Screen name="viewResource" key="viewResource" options={{ headerShown: true, header: SimpleBackHeader }} component={ViewResource} />
        </StackNav.Navigator>
    </ConversationContextProvider>
}

export default Chat