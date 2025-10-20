import React, { useContext, useState } from "react"
import { Dimensions } from "react-native"
import { RouteProps } from "@/lib/utils"
import Conversation from "../chat/Conversation"
import PastConversations from "../chat/PastConversations"
import { lightPrimaryColor, primaryColor } from "../layout/constants"
import { NativeStackHeaderProps, createNativeStackNavigator } from "@react-navigation/native-stack"
import { IconButton } from "react-native-paper"
import LoadedZone from "../LoadedZone"
import ConversationContextProvider, { ConversationContext } from "../chat/ConversationContextProvider"
import { AppContext } from "../AppContextProvider"
import ChatBackground from "../chat/ChatBackground"
import Images from "@/Images"
import NoConversationYet from "../chat/NoConversationYet"
import BareIconButton from "../layout/BareIconButton"
import SimpleBackHeader from "../layout/SimpleBackHeader"
import ViewAccount from "./ViewAccount"
import ViewResource from "../resources/ViewResource"
import SendTokensDialog from "../account/SendTokensDialog"
import ResourceAuthorHeader from "../resources/ResourceAuthorHeader"

interface ChatHeaderProps extends NativeStackHeaderProps {
    goBack?: () => void
    onResourceShowRequested: (id: number) => void
    onAccountShowRequested: (id: number) => void
}

export const ChatHeader = (p: ChatHeaderProps) => {
    const appContext = useContext(AppContext)
    const conversationContext = useContext(ConversationContext)
    const [sendingTokensTo, setSendingTokensTo] = useState<number | undefined>()
    
    return (<LoadedZone loading={conversationContext.conversationState.loading} error={conversationContext.conversationState.error}
        containerStyle={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', 
            backgroundColor: lightPrimaryColor, maxWidth: Dimensions.get('window').width, paddingVertical: 5 }} loadIndicatorColor={primaryColor}>
            { conversationContext.conversationState.data?.resource && <>
                <BareIconButton testID="backToConversationList" Image="chevron-left" size={40} onPress={() => p.goBack ? p.goBack() : p.navigation.goBack() }/>
                <ResourceAuthorHeader avatarAccountInfo={conversationContext.conversationState.data.otherAccount}
                    onPress={() => p.onAccountShowRequested(conversationContext.conversationState.data!.otherAccount.id)} resource={conversationContext.conversationState.data.resource} />
                <IconButton style={{ borderRadius: 0 }} icon={Images.Search} onPress={() => p.onResourceShowRequested(conversationContext.conversationState.data!.resource!.id)} />
                { appContext.account && 
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