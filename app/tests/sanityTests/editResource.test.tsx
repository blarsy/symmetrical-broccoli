import { render, waitFor, screen, fireEvent, userEvent } from "@testing-library/react-native"
import { checkResourcePresent } from "./datastoreCheck"
import { AppWithScreens } from "./lib"
import React from "react"
import { cleanupTestAccounts, createResource, makeTestAccounts, TestAccount } from "./datastoreSetupLib"
import ResourcesList from "@/components/resources/ResourcesList"
import '@testing-library/react-native/extend-expect'
import EditResource from "@/components/form/EditResource"
import relativeTime from 'dayjs/plugin/relativeTime'
import dayjs from "dayjs"

dayjs.extend(relativeTime)

jest.useFakeTimers()

const title = 'title', description= 'description', isProduct= false, isService= true, canBeDelivered= false, 
    canBeTakenAway= false, canBeExchanged= true, canBeGifted= false, 
    expiration= new Date(new Date().valueOf() + 1000 * 60 * 60 * 24 * 3), categoryCodes= [2, 6]

const title2 = 'title2', description2= 'description2', isProduct2= true, isService2= false, canBeDelivered2= true, 
    canBeTakenAway2= true, canBeExchanged2= false, canBeGifted2= true, 
    expiration2= new Date(new Date().valueOf() + 1000 * 60 * 60 * 24 * 4), categoryCodes2= [4, 8]

let account: TestAccount, resourceId: number

beforeEach(async () => {
    [account] = await makeTestAccounts([{}])
    resourceId = await createResource(account.data.token, title, description, isProduct, isService, canBeDelivered, canBeTakenAway, 
        canBeExchanged, canBeGifted,expiration, categoryCodes)
})

afterEach(async () => {
    await cleanupTestAccounts([account])
})

test('Edit resource', async () => {
    render(<AppWithScreens screens={[{ component: ResourcesList, name: 'resourceList' }, { component: EditResource, name: 'editResource' }]}
        overrideSecureStore={{ get: async () => account.data.token, set: async () => {}, remove: async () => {} }} />)

    try {
        await waitFor(() => expect(screen.getByTestId(`resourceList:ResourceCard:${resourceId}:EditButton`)).toBeOnTheScreen())
    
        // Use userEvent to trigger a 'press' on this button, because it is more intelligent than fireEvent,
        // in that it provides an event object with a 'stopPropagation' function
        const pressEdit = userEvent.setup()
        await pressEdit.press(screen.getByTestId(`resourceList:ResourceCard:${resourceId}:EditButton`))
    
        //await waitFor(() => expect(screen.getByTestId(`title`)).toBeOnTheScreen())
        //await waitFor(() => expect(screen.getByTestId(`title`)).toHaveProp('value', title))
        await waitFor(() => expect(screen.getByTestId('categories:Button')).toBeOnTheScreen())
    
        fireEvent.changeText(screen.getByTestId('title'), title2)
        fireEvent.changeText(screen.getByTestId('description'), description2)
        fireEvent.press(screen.getByTestId('nature:isService:Button'))
        fireEvent.press(screen.getByTestId('nature:isProduct:Button'))
        fireEvent.press(screen.getByTestId('exchangeType:canBeExchanged:Button'))
        fireEvent.press(screen.getByTestId('exchangeType:canBeGifted:Button'))
        fireEvent.press(screen.getByTestId('transport:canBeDelivered:Button'))
        fireEvent.press(screen.getByTestId('transport:canBeTakenAway:Button'))
    
        fireEvent.press(screen.getByTestId('expiration:Button'))
        fireEvent(screen.getByTestId('expiration:Picker:date'), 'onChangeText', expiration2.valueOf())
    
        fireEvent.press(screen.getByTestId('categories:Button'))
        await waitFor(() => expect(screen.getByTestId('categories:Modal:ConfirmButton')).toBeOnTheScreen())
        categoryCodes2.forEach(catCode => fireEvent.press(screen.getByTestId(`categories:Modal:Category:${catCode}`)))
        
        fireEvent.press(screen.getByTestId('categories:Modal:ConfirmButton'))
        fireEvent.press(screen.getByTestId('submitButton'))
    
        await waitFor(() => expect(screen.getByTestId('resourceEditionFeedback:Success')).toBeOnTheScreen())
    
        await checkResourcePresent(account.info.email, title2, description2, isProduct2, isService2, canBeDelivered2, canBeTakenAway2, canBeExchanged2, canBeGifted2, expiration2, categoryCodes.concat(categoryCodes2))
        
    } catch(e) {
        screen.debug()
    }

})