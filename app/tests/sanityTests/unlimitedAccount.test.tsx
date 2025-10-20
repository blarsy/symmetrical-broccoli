import React from "react"
import { cleanupTestAccounts, createResource, makeTestAccounts, TestAccount } from "./datastoreSetupLib"
import { AppWithSingleScreen, createResourceThroughUI } from "./lib"
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import Resources from "@/components/mainViews/Resources"
import { checkAccountWillingToContribute } from "./datastoreCheck"
import { daysFromNow } from "@/lib/utils"

let account: TestAccount, res1Id: number, resName: string
beforeEach(async () => {
    [account] = await makeTestAccounts([{ confirm: true, unlimited: true }])
    resName = `${account.info.name}`

    const expiration = daysFromNow(1)

    await Promise.all([
        (async() => res1Id = await createResource(account.data.token, resName, 'description', true, false, true, true, true, false, expiration, [1]))(),
        createResource(account.data.token, resName + '2', 'description2', true, false, true, true, true, false, expiration, [2]),
    ])
})

afterEach(async () => {
    await cleanupTestAccounts([account])
})

test('Adding a resource above the free tier works without needing to become contributor', async() => {
    render(<AppWithSingleScreen component={Resources} name="resources" 
        overrideSecureStore={{ get: async () => {
            return account.data.token
        }, set: async () => {}, remove: async () => {} }} />)

    await waitFor(() => expect(screen.getByTestId(`resourceList:ResourceCard:${res1Id}:EditButton`)).toBeOnTheScreen(), { timeout: 3000 })

    fireEvent.press(screen.getByTestId('ResourcesAppendableList:addButton'))

    await createResourceThroughUI(resName + '3', 'description3', daysFromNow(30), screen, false)
    
    //Check account was not updated to contribution mode
    expect(await checkAccountWillingToContribute(account.info.email)).toBeFalsy()
    
    //Check UI does not switch to contribution mode
    await waitFor(() => expect(screen.getByTestId(`resourceList:ResourceCard:${res1Id}:EditButton`)).toBeOnTheScreen(), { timeout: 3000 })
    //check amount of topes not displayed
    expect(screen.queryByTestId('Tokens:amount')).not.toBeOnTheScreen()
})