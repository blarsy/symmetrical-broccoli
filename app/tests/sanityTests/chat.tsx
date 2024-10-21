import EditResource from "@/components/form/EditResource"
import Notifications from "@/components/notifications/Notifications"
import { render, waitFor, screen, fireEvent } from "@testing-library/react-native"
import React from "react"
import { checkResourcePresent, checkLastNotificationExists } from "./datastoreCheck"
import { createAndLogIn, createResource, deleteAccount, getTestNum } from "./datastoreSetupLib"
import { AppWithScreens, AppWithSingleScreen } from "./lib"
import Conversation from "@/components/chat/Conversation"
import { SearchResults } from "@/components/mainViews/Search"


const testNum = getTestNum()
const email = `me${testNum}@me.com`, emailAccount2 = `me${testNum}-2@me.com`, password= 'Password1!'
const name = `me${testNum}`, name2 = `me${testNum}-2`
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
        createAndLogIn(email, name, password),
        createAndLogIn(emailAccount2, name2, password)
    ])

    resourceId = await createResource(tokens[0], `${name}-res`, 'description', true, true, true, true, 
        true, true, new Date(new Date().valueOf() + 1000 * 60 * 60 * 24 * 3), [2])
})

test('Send chat message about a resource', async () => {
    render(<AppWithScreens screens={[{ component: SearchResults, name: 'searchResults' }, { component: Conversation, name: 'conversation' }]} />)

    await waitFor(() => expect(screen.getByTestId('searchText')).toBeOnTheScreen())

    fireEvent.changeText(screen.getByTestId('searchText'), name)
    await waitFor(() => expect(screen.getByTestId(`FoundResource:${resourceId}:ChatButton`)).toBeOnTheScreen())

    fireEvent.press(screen.getByTestId(`FoundResource:${resourceId}:ChatButton`))
    
    await waitFor(() => expect(screen.getByTestId(`FoundResource:${resourceId}:ChatButton`)).toBeOnTheScreen())


    fireEvent.press(screen.getByTestId('expiration:Button'))
    fireEvent(screen.getByTestId('expiration:Picker:date'), 'onChangeText', someDate.valueOf())

    fireEvent.press(screen.getByTestId('categories:Button'))
    await waitFor(() => expect(screen.getByTestId('categories:Modal:ConfirmButton')).toBeOnTheScreen())
    fireEvent.press(screen.getByTestId('categories:Modal:Category:2'))
    fireEvent.press(screen.getByTestId('categories:Modal:Category:11'))
    fireEvent.press(screen.getByTestId('categories:Modal:ConfirmButton'))

    fireEvent.press(screen.getByTestId('submitButton'))

    await waitFor(() => expect(screen.getByTestId('resourceEditionFeedback:Success')).toBeOnTheScreen())

    await checkResourcePresent(email, title, description, false, true, false, false, true, false, someDate, [2, 11])

    const notif = await checkLastNotificationExists(emailAccount2)
    render(<AppWithSingleScreen component={Notifications} name="notifications" 
        overrideSecureStore={{ get: async () => tokens[1], set: async () => {}, remove: async () => {} }} />)

    await waitFor(() => expect(screen.getByTestId(`notifications:${notif.id}:Text`)).toBeOnTheScreen())
}, 10000)