import { fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import { createAndLogIn, createResource, deleteAccount, getTestNum } from "./datastoreSetupLib"
import { AppWithSingleScreen } from "./lib"
import React from "react"
import '@testing-library/react-native/extend-expect'
import { checkAccountWillingToContribute } from "./datastoreCheck"
import Resources from "@/components/mainViews/Resources"

const testNum = getTestNum()
const email = `me${testNum}@me.com`, password= 'Password1!', name = `me${testNum}`
const resName = `${name}-res`
let res1Id: number
let token: string

beforeEach(async () => {
    token = await createAndLogIn(email, name, password, true)

    await Promise.all([
        (async() => res1Id = await createResource(token, resName, 'description', true, false, true, true, true, false, new Date(new Date().valueOf() + 1000 * 60 * 60 * 24 * 30), [1]))(),
        createResource(token, resName + '2', 'description2', true, false, true, true, true, false, new Date(new Date().valueOf() + 1000 * 60 * 60 * 24 * 30), [2]),
    ])
})

afterAll(async () => {
    await deleteAccount(email, password)
})

test(`become contributor when creating one's 3rd resource`, async () => {
    render(<AppWithSingleScreen component={Resources} name="resources" 
        overrideSecureStore={{ get: async () => {
            return token
        }, set: async () => {}, remove: async () => {} }} />)

    await waitFor(() => expect(screen.getByTestId(`resourceList:ResourceCard:${res1Id}:EditButton`)).toBeOnTheScreen(), { timeout: 3000 })

    fireEvent.press(screen.getByTestId('ResourcesAppendableList:addButton'))

    //Check the switch to contribution mode screen is displayed
    await waitFor(() => expect(screen.getByTestId(`SwitchToContributionModeDialog`)).toBeOnTheScreen())

    fireEvent.press(screen.getByTestId('SwitchToContributionModeDialog:YesButton'))
    await waitFor(() => expect(screen.getByTestId(`BackButton`)).toBeOnTheScreen(), { timeout: 4000 })

    //Check account updated
    expect(checkAccountWillingToContribute(email)).toBeTruthy()
    
    //Check UI adapts to contribution mode
    fireEvent.press(screen.getByTestId('BackButton'))
    await waitFor(() => expect(screen.getByTestId(`resourceList:ResourceCard:${res1Id}:EditButton`)).toBeOnTheScreen(), { timeout: 3000 })
    //check amount of topes
    expect(screen.getByTestId('Tokens:amount')).toHaveTextContent('30 Topes')

    fireEvent.press(screen.getByTestId('ResourcesAppendableList:addButton'))

    //Check the switch to contribution mode screen is no mmore displayed
    await waitFor(() => expect(screen.getByTestId(`BackButton`)).toBeOnTheScreen())

})