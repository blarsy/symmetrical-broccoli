import React  from 'react'
import { EditResourceContext } from '../components/resources/EditResourceContextProvider'
import DataLoadState, { fromData, initial } from './DataLoadState'
import { AccountInfo, Category, Resource } from './schema'
import { SearchFilterContext } from '@/components/SearchFilterContextProvider'
import { PaperProvider, Text } from 'react-native-paper'
import { MockedProvider, MockedResponse } from "@apollo/react-testing"
import { DocumentNode } from 'graphql'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/fr'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { NavigationContainer } from '@react-navigation/native'
import { ConversationContext, ConversationState } from '@/components/chat/ConversationContextProvider'

import { getTheme, useCustomFonts } from './utils'
import { AppContextProvider } from '@/components/AppContextProvider'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { View } from 'react-native'
import { IMessage } from '@/components/chat/Chat'

export const editResourceContextDecorator = (initialResource?: Resource) => (StoryElement: any) => <EditResourceContext.Provider value={{ state: 
    {
        editedResource: initialResource || { id: 0, created: new Date(), images: [], title: '', description: '', canBeDelivered: false, 
            canBeExchanged: false, canBeGifted: false, canBeTakenAway: false, categories: [], isProduct: false,
            isService: false, deleted: null, specificLocation: null, expiration: new Date() },
        changeCallbacks: [], imagesToAdd: []},
        actions: {
            setResource: () => {},
            setChangeCallback: () => {},
            removeChangeCallback: () => {},
            addImage: async() => {},
            deleteImage: async() => {},
            save: async() => {},
            reset: () => { }
    }}}>
    <StoryElement />
</EditResourceContext.Provider>

export const appContextDecorator = (noAccount: boolean = false, noAccountLogo: boolean = true) => 
    (StoryElement: React.ElementType) => 
        makeAppContextProvider(StoryElement, noAccount ? undefined : { id: 1, email: 'me@me.com', name: 'Artisans inspirés', activated: new Date(), avatarPublicId: noAccountLogo ? '' : 'zkuqb85k5v1xvjdx0yjv' })

const defaultResourceCategories: Category[] = [
    { code: 1, name: 'category 1' },
    { code: 2, name: 'category 2' },
    { code: 3, name: 'category 3' },
    { code: 4, name: 'category 4' }
]

export const makeAppContextProvider = (StoryElement: React.ElementType, account?: AccountInfo) => <AppContextProvider initialState={{
    newChatMessage: '', categories: fromData(defaultResourceCategories), account, numberOfUnreadNotifications: 0,
    chatMessagesSubscription: undefined, lastConversationChangeTimestamp: 0, connecting: undefined, 
    messageReceivedHandler: undefined, lastNotification: undefined, apolloClient: undefined, unreadConversations: [],
    notificationReceivedHandler: undefined }}>
    <StoryElement />
</AppContextProvider>

export const searchFilterContextDecorator = (resources: DataLoadState<Resource[]> = initial<Resource[]>(true, [])) => (StoryElement: React.ElementType) => <SearchFilterContext.Provider value={{ 
    filter: { categories: [], location: { distanceToReferenceLocation: 50, excludeUnlocated: false }, options: { canBeDelivered: false, canBeExchanged: false, canBeGifted: false, canBeTakenAway: false, isProduct: false, isService: false }, search: '' }, 
    actions: {
        requery: async() => {},
        setSearchFilter: () => {}
    }, results: resources }}>
    <StoryElement />
</SearchFilterContext.Provider>

export const conversationContextDecorator =  (initialConversationData: ConversationState) => {
    return (StoryElement: React.ElementType) => 
    <ConversationContext.Provider value={{ 
        state: initialConversationData,
        actions: { load: async () => {}, setMessages: (fn: (prevMessages: IMessage[]) => IMessage[]) => {}, loadEarlier: async () => {} }
    }}>
        <StoryElement />
    </ConversationContext.Provider>
}

export const statusBarCompensatorDecorator = (StoryElement: React.ElementType) => <View style={{ flex:1, marginTop: -30 }}>
    <StoryElement/>
</View>

export const paperProviderDecorator = (StoryElement: React.ElementType) => {
    const [fontsLoaded, fontError] = useCustomFonts()

    if(!fontsLoaded) {
        return <Text>Loading fonts for Storybook ...</Text>
    }
    
    return <PaperProvider theme={getTheme()}>
        <StoryElement />
    </PaperProvider>
}

export interface GraphQlOp {
    query: DocumentNode,
    result: any,
    variables?: Record<string, any>
}

export const apolloClientMocksDecorator = (ops: GraphQlOp[]) => 
    (Story: React.ElementType) => {
        return <MockedProvider mocks={
            ops.map(op => ({
                delay: 2000,
                request: { query: op.query, variables: op.variables },
                result: { data: op.result }
            } as MockedResponse<any, any>))
        }>
            <Story />
        </MockedProvider>
    }

export const configDayjsDecorator = (Story: React.ElementType) => {
    dayjs.extend(relativeTime)
    dayjs.locale('fr')
    dayjs.extend(utc)
    return <Story />
}

export const navigationContainerDecorator = (initialState: any = undefined ) => (Story: React.ElementType) =>
    <NavigationContainer initialState={initialState || { routes: []}}>
        <Story />
    </NavigationContainer>

export const gestureHandlerDecorator = (Story: React.ElementType) =>
    <GestureHandlerRootView style={{ flex: 1 }}>
        <Story />
    </GestureHandlerRootView>
