import { render, waitFor, fireEvent } from "@testing-library/react-native"
import React from "react"
import { cleanupTestAccounts, createResource, makeTestAccounts, TestAccount } from "./datastoreSetupLib"
import { AppWithScreens, checkBadge } from "./lib"
import { SearchResults } from "@/components/mainViews/Search"
import Chat from '@/components/mainViews/Chat'
import utc from 'dayjs/plugin/utc'
import dayjs from "dayjs"
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/fr'
dayjs.extend(relativeTime)
dayjs.extend(utc)

let testAccounts: TestAccount[]
let resourceId: string, resName: string

beforeEach(async () => {
    testAccounts = await makeTestAccounts([{ confirm: true, contributor: true },{ confirm: true, contributor: true }])

    resName = `${testAccounts[0].info.name}-res`
    resourceId = await createResource(testAccounts[0].data.token, resName, 'description', true, true, true, true, 
        true, true, new Date(new Date().valueOf() + 1000 * 60 * 60 * 24 * 3), [2])

})

afterEach(async () => {
    await cleanupTestAccounts(testAccounts)
})

test('Send chat message about a resource', async () => {
    const testMessage = 'test message'
    const screenSender = render(<AppWithScreens 
        screens={[{ component: SearchResults, name: 'searchResults' }, { component: Chat, name: 'chat' }]}
        overrideSecureStore={{ get: async () => testAccounts[1].data.token, set: async () => {}, remove: async () => {} }} />)

    await waitFor(() => expect(screenSender.getByTestId('searchText')).toBeOnTheScreen())

    fireEvent.changeText(screenSender.getByTestId('searchText'), testAccounts[0].info.name)
    await waitFor(() => expect(screenSender.getByTestId(`FoundResource:${resourceId}:ChatButton`)).toBeOnTheScreen())

    fireEvent.press(screenSender.getByTestId(`FoundResource:${resourceId}:ChatButton`))
    
    await waitFor(() => expect(screenSender.getByTestId(`conversation:SendButton`)).toBeOnTheScreen())

    fireEvent.changeText(screenSender.getByTestId('conversation:Message'), testMessage)
    fireEvent.press(screenSender.getByTestId('conversation:SendButton'))

    await waitFor(() => expect(screenSender.getByTestId('conversation:Messages:0')).toBeOnTheScreen())
    expect(screenSender.getByTestId('conversation:Messages:0')).toHaveTextContent(testMessage)
    //screenSender.unmount()

    const screenReceiver = render(<AppWithScreens 
        overrideSecureStore={{ get: async () => testAccounts[0].data.token, set: async () => {}, remove: async () => {} }} />)

    await checkBadge('chatUnreads', '1', screenReceiver)

    const screenConversations = render(<AppWithScreens 
        screens={[{ component: Chat, name: 'chat' }]}
        overrideSecureStore={{ get: async () => testAccounts[0].data.token, set: async () => {}, remove: async () => {} }} />)

    await waitFor(() => expect(screenConversations.getByTestId('conversation:0:Button')).toBeOnTheScreen())

    expect(screenConversations.getByTestId('conversation:0:WithUserName')).toHaveTextContent(testAccounts[1].info.name)
    expect(screenConversations.getByTestId('conversation:0:ResourceTitle')).toHaveTextContent(resName)
    expect(screenConversations.getByTestId('conversation:0:LastMessage')).toHaveTextContent(testMessage)
    expect(screenConversations.getByTestId('conversation:0:UnreadMarker', { includeHiddenElements: true })).toBeOnTheScreen()

    fireEvent.press(screenConversations.getByTestId('conversation:0:Button'))

    await waitFor(() => expect(screenConversations.getByTestId('conversation:Messages:0')).toBeOnTheScreen())
    expect(screenConversations.getByTestId('conversation:Messages:0')).toHaveTextContent(testMessage)

    // back to conversations
    fireEvent.press(screenConversations.getByTestId('backToConversationList'))
    // check conversation marked as read
    await waitFor(() => expect(screenConversations.getByTestId('conversation:0:Button')).toBeOnTheScreen())
    expect(screenConversations.queryByTestId('conversation:0:UnreadMarker')).not.toBeOnTheScreen()
    
    // check 'chat' badge has disappeared
    const screenReceiverAfter = render(<AppWithScreens 
        overrideSecureStore={{ get: async () => testAccounts[0].data.token, set: async () => {}, remove: async () => {} }} />)

    await waitFor(() => expect(screenReceiverAfter.getByTestId('searchText')).toBeOnTheScreen())
    expect(screenReceiverAfter.queryByTestId('chatUnreads')).not.toBeOnTheScreen()
})