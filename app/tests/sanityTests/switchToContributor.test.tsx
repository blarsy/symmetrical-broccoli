import { fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import { cleanupTestAccounts, createResource, makeTestAccounts, TestAccount } from "./datastoreSetupLib"
import { AppWithSingleScreen } from "./lib"
import React from "react"
import { checkAccountWillingToContribute } from "./datastoreCheck"
import Resources from "@/components/mainViews/Resources"

let account: TestAccount, res1Id: number

beforeEach(async () => {
    [account] = await makeTestAccounts([{ confirm: true }])

    const resName = `${account.info.name}-res`
    await Promise.all([
        (async() => res1Id = await createResource(account.data.token, resName, 'description', true, false, true, true, true, false, new Date(new Date().valueOf() + 1000 * 60 * 60 * 24 * 30), [1]))(),
        createResource(account.data.token, resName + '2', 'description2', true, false, true, true, true, false, new Date(new Date().valueOf() + 1000 * 60 * 60 * 24 * 30), [2]),
    ])
})

afterAll(async () => {
    await cleanupTestAccounts([account])
})

test(`become contributor when creating one's 3rd resource`, async () => {
    render(<AppWithSingleScreen component={Resources} name="resources" 
        overrideSecureStore={{ get: async () => {
            return account.data.token
        }, set: async () => {}, remove: async () => {} }} />)

    await waitFor(() => expect(screen.getByTestId(`resourceList:ResourceCard:${res1Id}:EditButton`)).toBeOnTheScreen(), { timeout: 3000 })

    fireEvent.press(screen.getByTestId('ResourcesAppendableList:addButton'))

    //Check the switch to contribution mode screen is displayed
    await waitFor(() => expect(screen.getByTestId(`SwitchToContributionModeDialog`)).toBeOnTheScreen())

    fireEvent.press(screen.getByTestId('SwitchToContributionModeDialog:YesButton'))
    await waitFor(() => expect(screen.getByTestId(`BackButton`)).toBeOnTheScreen(), { timeout: 4000 })

    //Check account updated
    expect(checkAccountWillingToContribute(account.info.email)).toBeTruthy()
    
    //Check UI adapts to contribution mode
    fireEvent.press(screen.getByTestId('BackButton'))
    await waitFor(() => expect(screen.getByTestId(`resourceList:ResourceCard:${res1Id}:EditButton`)).toBeOnTheScreen(), { timeout: 3000 })
    //check amount of topes
    expect(screen.getByTestId('TokenCounter:AmountOfTokens')).toHaveTextContent('X30')

    fireEvent.press(screen.getByTestId('ResourcesAppendableList:addButton'))

    //Check the switch to contribution mode screen is no mmore displayed
    await waitFor(() => expect(screen.getByTestId(`BackButton`)).toBeOnTheScreen())

})