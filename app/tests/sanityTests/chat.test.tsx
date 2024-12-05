import '@testing-library/react-native/extend-expect'
import { render, waitFor, screen, fireEvent, userEvent } from "@testing-library/react-native"
import React from "react"
import { createAndLogIn, createResource, deleteAccount, getTestNum } from "./datastoreSetupLib"
import { AppWithScreens, checkBadge } from "./lib"
import { SearchResults } from "@/components/mainViews/Search"
import Chat from '@/components/mainViews/Chat'
import utc from 'dayjs/plugin/utc'
import dayjs from "dayjs"
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/fr'
dayjs.extend(relativeTime)
dayjs.extend(utc)

const testNum = getTestNum()
const email = `me${testNum}@me.com`, emailAccount2 = `me${testNum}-2@me.com`, password= 'Password1!'
const name = `me${testNum}`, name2 = `me${testNum}-2`
const resName = `${name}-res`
let tokens: string[]
let resourceId: number

afterEach(async () => {
    await Promise.all([
        deleteAccount(email, password),
        deleteAccount(emailAccount2, password)
    ])
})

beforeEach(async () => {
    tokens = await Promise.all([
        createAndLogIn(email, name, password, true),
        createAndLogIn(emailAccount2, name2, password, true)
    ])

    resourceId = await createResource(tokens[0], resName, 'description', true, true, true, true, 
        true, true, new Date(new Date().valueOf() + 1000 * 60 * 60 * 24 * 3), [2])
})

test('Send chat message about a resource', async () => {
    const testMessage = 'test message'
    const screenSender = render(<AppWithScreens 
        screens={[{ component: SearchResults, name: 'searchResults' }, { component: Chat, name: 'chat' }]}
        overrideSecureStore={{ get: async () => tokens[1], set: async () => {}, remove: async () => {} }} />)

    await waitFor(() => expect(screenSender.getByTestId('searchText')).toBeOnTheScreen())

    fireEvent.changeText(screenSender.getByTestId('searchText'), name)
    await waitFor(() => expect(screenSender.getByTestId(`FoundResource:${resourceId}:ChatButton`)).toBeOnTheScreen())

    fireEvent.press(screenSender.getByTestId(`FoundResource:${resourceId}:ChatButton`))
    
    await waitFor(() => expect(screenSender.getByTestId(`conversation:SendButton`)).toBeOnTheScreen())

    fireEvent.changeText(screenSender.getByTestId('conversation:Message'), testMessage)
    fireEvent.press(screenSender.getByTestId('conversation:SendButton'))

    await waitFor(() => expect(screenSender.getByTestId('conversation:Messages:0')).toBeOnTheScreen())
    expect(screenSender.getByTestId('conversation:Messages:0')).toHaveTextContent(testMessage)
    //screenSender.unmount()

    const screenReceiver = render(<AppWithScreens 
        overrideSecureStore={{ get: async () => tokens[0], set: async () => {}, remove: async () => {} }} />)

    await checkBadge('chatUnreads', '1', screenReceiver)

    const screenConversations = render(<AppWithScreens 
        screens={[{ component: Chat, name: 'chat' }]}
        overrideSecureStore={{ get: async () => tokens[0], set: async () => {}, remove: async () => {} }} />)

    await waitFor(() => expect(screenConversations.getByTestId('conversation:0:Button')).toBeOnTheScreen())

    expect(screenConversations.getByTestId('conversation:0:WithUserName')).toHaveTextContent(name2)
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
        overrideSecureStore={{ get: async () => tokens[0], set: async () => {}, remove: async () => {} }} />)

    await waitFor(() => expect(screenReceiverAfter.getByTestId('searchText')).toBeOnTheScreen())
    expect(screenReceiverAfter.queryByTestId('chatUnreads')).not.toBeOnTheScreen()
})