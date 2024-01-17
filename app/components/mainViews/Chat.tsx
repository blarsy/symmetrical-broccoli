import React, { ReactNode, useContext } from "react"
import { View } from "react-native"
import { GET_RESOURCE, RouteProps } from "@/lib/utils"
import Conversation from "../Conversation"
import PastConversations from "../PastConversations"
import Images from "@/Images"
import { lightPrimaryColor, primaryColor } from "../layout/constants"
import { ScrollView } from "react-native-gesture-handler"
import { NativeStackHeaderProps, createNativeStackNavigator } from "@react-navigation/native-stack"
import { Resource, fromServerGraphResource } from "@/lib/schema"
import { ResourceImage } from "../MainResourceImage"
import { fontSizeMedium } from "./Start"
import { Button, Icon, Text } from "react-native-paper"
import { t } from "@/i18n"
import { useQuery } from "@apollo/client"
import { EditResourceContext } from "../EditResourceContextProvider"
import LoadedZone from "../LoadedZone"

interface ChatHeaderProps extends NativeStackHeaderProps {
    goBack?: () => void
}

const ChatHeader = (p: ChatHeaderProps) => {
    const editResourceContext = useContext(EditResourceContext)
    const { data, loading, error } = useQuery(GET_RESOURCE, { variables: { id: (p.route.params! as any).resourceId }})
    let resource: Resource | undefined = undefined
    const exchangeTypes: string[] = []
    
    if(data && editResourceContext.state.categories.data) {
        resource = fromServerGraphResource(data.resourceById, editResourceContext.state.categories.data)
        
        if(resource.canBeGifted) exchangeTypes.push(t('canBeGifted_label'))
        if(resource.canBeExchanged) exchangeTypes.push(t('canBeExchanged_label'))
    }
    
    return (<LoadedZone loading={loading} error={error} containerStyle={{ flexDirection: 'row', justifyContent:'space-between', alignItems: 'center' }}>
        <Button textColor={primaryColor} icon={p => <Icon size={p.size} source="chevron-left" color={p.color} /> }
            onPress={() => p.goBack ? p.goBack() : p.navigation.goBack() }>{t('back_label')}</Button>
        {resource ? <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ResourceImage size={70} resource={resource} />
            <View style={{ flexDirection: 'column', padding: 6, gap: 2 }}>
                <Text variant="headlineMedium" style={{ color: primaryColor, textTransform: 'uppercase' }}><Icon size={fontSizeMedium} color={primaryColor} source="account-circle" /> {resource.account!.name}</Text>
                <Text variant="headlineMedium" style={{ textTransform: 'uppercase' }}>{resource.title}</Text>
                <Text variant="headlineMedium" style={{ color: primaryColor, textTransform: 'uppercase' }}>{exchangeTypes.join('/')}</Text>
            </View>
        </View> : <></>}
    </LoadedZone>)
}

const ChatBackground = ({ children }: { children: ReactNode }) => {
    return <ScrollView style={{ display: 'flex', flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ flex: 1 }}>
    <Images.BackgroundChat fill={lightPrimaryColor} style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    />
    { children }
</ScrollView>
}

const ConversationsList = ({ route, navigation }: RouteProps) => <ChatBackground>
    <PastConversations onConversationSelected={resource => navigation.navigate('conversation', { resourceId: resource.id })} />
</ChatBackground>

const ConversationDetail = ({ route, navigation }: RouteProps) => <ChatBackground>
    <Conversation resourceId={route.params.resourceId} />
</ChatBackground>

const StackNav = createNativeStackNavigator()

const Chat = ({ route, navigation }: RouteProps) => {
    return <StackNav.Navigator screenOptions={{ contentStyle: { backgroundColor: '#fff' } }}>
        <StackNav.Screen name="conversationsList" key="conversationsList" component={ConversationsList} options={{ headerShown: false }} />
        <StackNav.Screen name="conversation" key="conversation" options={{ header: p => <ChatHeader {...p} goBack={() => p.navigation.navigate('conversationsList')} /> }} component={ConversationDetail} />
    </StackNav.Navigator>
}

export default Chat