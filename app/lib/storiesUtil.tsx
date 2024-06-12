import React  from 'react'
import { EditResourceContext } from '../components/resources/EditResourceContextProvider'
import { fromData, initial } from './DataLoadState'
import { AccountInfo, Resource } from './schema'
import { SearchFilterContext } from '@/components/SearchFilterContextProvider'
import { PaperProvider } from 'react-native-paper'
import { MockedProvider, MockedResponse } from "@apollo/react-testing"
import { DocumentNode } from 'graphql'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/fr'
import dayjs from 'dayjs'
import { NavigationContainer } from '@react-navigation/native'
import { ConversationContext, ConversationState } from '@/components/chat/ConversationContextProvider'
import { IMessage } from 'react-native-gifted-chat'
import { getTheme } from './utils'
import { AppContextProvider } from '@/components/AppContextProvider'

export const editResourceContextDecorator = (StoryElement: any) => 
    makeEditResourceContextDecorator(StoryElement)

const makeEditResourceContextDecorator = (StoryElement: any) => <EditResourceContext.Provider value={{ state: 
    { editedResource: undefined, changeCallbacks: [], imagesToAdd: [] }, actions: {
            setResource: () => {},
            setChangeCallback: () => {},
            removeChangeCallback: () => {},
            addImage: async() => {},
            deleteImage: async() => {},
            save: async() => {},
            reset: () => {}
    }}}>
    <StoryElement />
</EditResourceContext.Provider>

export const appContextDecorator = (StoryElement: React.ElementType, noAccount: boolean = false) => makeAppContextProvider(StoryElement, noAccount ? undefined : { id: 1, email: 'me@me.com', name: 'account-name', activated: new Date(), avatarPublicId: '' })

const defaultResourceCategories = [
    { code: 'cat1', name: 'category 1' },
    { code: 'cat2', name: 'category 2' },
    { code: 'cat3', name: 'category 3' },
    { code: 'cat4', name: 'category 4' }
]

const makeAppContextProvider = (StoryElement: React.ElementType, account?: AccountInfo) => <AppContextProvider initialState={{
    newChatMessage: '', categories: fromData(defaultResourceCategories), numberOfUnread: 0, account, 
    chatMessagesSubscription: undefined, lastConversationChangeTimestamp: 0, connecting: undefined, 
    messageReceivedHandler: undefined, lastNotification: undefined, apolloClient: undefined }}>
    <StoryElement />
</AppContextProvider>

export const searchFilterContextDecorator = (StoryElement: React.ElementType) => makeSeachFilterContextProvider(StoryElement)

const makeSeachFilterContextProvider = (StoryElement: React.ElementType) => <SearchFilterContext.Provider value={{ 
    filter: { categories: [], options: { canBeDelivered: false, canBeExchanged: false, canBeGifted: false, canBeTakenAway: false, isProduct: false, isService: false }, search: '' }, 
    actions: {
        requery: async() => {},
        setSearchFilter: () => {}
    }, results: initial<Resource[]>(true, []) }}>
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

export const paperProviderDecorator = (StoryElement: React.ElementType) => <PaperProvider theme={getTheme()}>
    <StoryElement />
</PaperProvider>

interface GraphQlOp {
    query: DocumentNode,
    result: any,
    variables?: Record<string, any>
}

export const apolloClientMocksDecorator = (ops: GraphQlOp[]) =>
(Story: React.ElementType) => <MockedProvider mocks={
    ops.map(op => ({
        delay: 2000,
        request: { query: op.query, variables: op.variables },
        result: { data: op.result }
    } as MockedResponse<any, any>))
  }>
    <Story />
  </MockedProvider>

export const configDayjsDecorator = (Story: React.ElementType) => {
    dayjs.extend(relativeTime)
    dayjs.locale('fr')
    return <Story />
}

export const navigationContainerDecorator = (initialState: any = undefined ) => (Story: React.ElementType) =>
    <NavigationContainer initialState={initialState}>
        <Story />
    </NavigationContainer>
