import { fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import { createAndLogIn, deleteAccount, getTestNum, simulateActivation } from "./datastoreSetupLib"
import React from "react"
import EditProfile from "@/components/form/EditProfile"
import { checkActivationEmailSent, checkNameOnAccount } from "./datastoreCheck"
import Start from "@/components/mainViews/Start"
import { AppContextProvider } from "@/components/AppContextProvider"
import '@testing-library/react-native/extend-expect'
import EditResource from "@/components/form/EditResource"
import { AppWithSingleScreen } from "./lib"

jest.useFakeTimers()

const testNum = getTestNum()
const email = `me${testNum}@me.com`, password= 'Password1!'
const name = `me${testNum}`
let token: string

afterEach(async () => {
    await deleteAccount(email, password)
})

beforeEach(async () => {
    token = await createAndLogIn(email, name, password)
})

test('edit account data', async () => {
    const newName = `me${testNum} modified`
    render(
        <AppContextProvider>
            <Start splashScreenMinimumDuration={0} overrideSecureStore={{ get: async () => token, set: async () => {}, remove: async () => {} }}>
                <EditProfile />
            </Start>
        </AppContextProvider>)

    await waitFor(() => expect(screen.getByTestId('name')).toHaveProp('value', name))
        
    fireEvent.changeText(screen.getByTestId('name'), newName)
    fireEvent.press(screen.getByTestId('save'))

    await waitFor(() => expect(screen.getByTestId('editProfileSuccess')).toBeOnTheScreen())
    await(() => expect(screen.getByTestId('emailChangingBanner')).not.toBeVisible())

    await checkNameOnAccount (email, newName)
})

test('edit account data: email', async () => {
    const newEmail = `new${email}`
    render(<AppContextProvider>
        <Start splashScreenMinimumDuration={0} overrideSecureStore={{ get: async () => token, set: async () => {}, remove: async () => {} }}>
            <EditProfile />
        </Start>
    </AppContextProvider>)

    await waitFor(() => expect(screen.getByTestId('email')).toHaveProp('value', email))
        
    fireEvent.changeText(screen.getByTestId('email'), newEmail)
    fireEvent.press(screen.getByTestId('save'))

    await waitFor(() => expect(screen.getByTestId('editProfileSuccess')).toBeOnTheScreen())
    await waitFor(() => expect(screen.getByTestId('emailChangingBanner')).toBeVisible())

    await checkNameOnAccount (email, name)
    const activationCode = await checkActivationEmailSent(newEmail)

    simulateActivation(activationCode)
    
    await checkNameOnAccount(newEmail, name)
})

test.only('Create resource', async () => {
    render(<AppWithSingleScreen component={EditResource} name="editResource" overrideSecureStore={{ get: async () => token, set: async () => {}, remove: async () => {} }} />)

    await waitFor(() => expect(screen.getByTestId('title')).toBeOnTheScreen())

    fireEvent.changeText(screen.getByTestId('title'), 'A title for this resource')
    fireEvent.changeText(screen.getByTestId('description'), 'A description, potentially long.')
    fireEvent.press(screen.getByTestId('nature:isProduct:Button'))
    
    screen.debug()
})