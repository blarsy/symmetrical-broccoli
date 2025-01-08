import React from "react"
import { createAndLogIn, createResource, deleteAccount, getTestNum } from "./datastoreSetupLib"
import { AppWithSingleScreen, createResourceThroughUI } from "./lib"
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import Resources from "@/components/mainViews/Resources"
import { checkAccountWillingToContribute } from "./datastoreCheck"
import '@testing-library/react-native/extend-expect'


const testNum = getTestNum()
const email = `me${testNum}@me.com`, password= 'Password1!', name = `me${testNum}`
const resName = `${name}-res`
let res1Id: number
let token: string
beforeEach(async () => {
    token = await createAndLogIn(email, name, password, true, false, true)

    const expiration = new Date( new Date().valueOf() + (1000 * 60 * 60 * 24) )

    await Promise.all([
        (async() => res1Id = await createResource(token, resName, 'description', true, false, true, true, true, false, expiration, [1]))(),
        createResource(token, resName + '2', 'description2', true, false, true, true, true, false, expiration, [2]),
    ])
})

afterEach(async () => {
    return deleteAccount(email, password)
})

test('Adding a resource above the free tier works without needing to become contributor', async() => {
    render(<AppWithSingleScreen component={Resources} name="resources" 
        overrideSecureStore={{ get: async () => {
            return token
        }, set: async () => {}, remove: async () => {} }} />)

    await waitFor(() => expect(screen.getByTestId(`resourceList:ResourceCard:${res1Id}:EditButton`)).toBeOnTheScreen(), { timeout: 3000 })

    fireEvent.press(screen.getByTestId('ResourcesAppendableList:addButton'))

    await createResourceThroughUI(resName + '3', 'description3', new Date(new Date().valueOf() + 1000 * 60 * 60 * 24 * 30), screen, false)
    
    //Check account was not updated to contribution mode
    expect(await checkAccountWillingToContribute(email)).toBeFalsy()
    
    //Check UI does not switch to contribution mode
    await waitFor(() => expect(screen.getByTestId(`resourceList:ResourceCard:${res1Id}:EditButton`)).toBeOnTheScreen(), { timeout: 3000 })
    //check amount of topes not displayed
    expect(screen.queryByTestId('Tokens:amount')).not.toBeOnTheScreen()
})