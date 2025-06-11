import { render, waitFor, screen } from "@testing-library/react-native"
import React from "react"
import { TestAccount, makeTestAccounts, cleanupTestAccounts } from "./datastoreSetupLib"
import { AppWithScreens, waitForThenPress } from "./lib"
import { checkAccountAddress, checkAccountData, checkAccountLogo } from "./datastoreCheck"
import '@testing-library/react-native/extend-expect'
import { DEFAUT_LOCATION } from "@/lib/utils"
import ResourcesList from "@/components/resources/ResourcesList"
import { ImageResult } from "expo-image-manipulator"

let testAccount: TestAccount

jest.mock('../../components/account/EditAddressModal')
jest.mock('@/lib/utils', () => ({
    ...jest.requireActual('@/lib/utils'),
    pickImage: jest.fn().mockImplementation((cb, height)=> {
        //console.log('picking dummy image...')
        cb({ height, uri: 'testuri', width: height, base64:'testbase64content' } as ImageResult)
    }),
}));

jest.mock('@/lib/images', () => ({
    ...jest.requireActual('@/lib/images'),
    uploadImage: jest.fn().mockImplementation((path) => {
        //console.log('uploading dummy ' + path)
        return 'dummy_public_id'
    }),
}));



beforeEach(async () => {
    [ testAccount ] = await makeTestAccounts([{ confirm: true, contributor: true }])
})

afterEach(async () => {
    await cleanupTestAccounts([testAccount])
})

test('Setting account address gives reward', async () => {
    render(<AppWithScreens screens={[{ component: ResourcesList, name: 'resourceList' }]}
        overrideSecureStore={{ get: async () => testAccount.data.token, set: async () => {}, remove: async () => {} }} />)
    
    await waitForThenPress('openProfile', screen,5000)

    await waitForThenPress('accountAddress:setAddress', screen)

    await waitForThenPress('MockEditAddressModalButton', screen)

    await waitFor(() => expect(screen.getByTestId('accountAddress:address')).toHaveTextContent('Dummy address'))
    await waitFor(() => expect(screen.getByTestId('publicInfoFeedback:Success')).toBeOnTheScreen())

    await waitForThenPress('Profile:BackButton', screen)

    await waitFor(() => expect(screen.getByTestId('TokenCounter:AmountOfTokens')).toHaveTextContent('X50'))
    
    expect(checkAccountAddress('Dummy address', DEFAUT_LOCATION.latitude, DEFAUT_LOCATION.longitude, testAccount.data.id)).toBeTruthy()
})

test('Setting account logo gives reward', async () => {
    render(<AppWithScreens screens={[{ component: ResourcesList, name: 'resourceList' }]}
        overrideSecureStore={{ get: async () => testAccount.data.token, set: async () => {}, remove: async () => {} }} />)
    
    await waitForThenPress('openProfile', screen,5000)

    await waitForThenPress('setImageButton', screen)

    await waitFor(() => expect(screen.getByTestId('editProfileFeedback:Success')).toBeOnTheScreen())

    await waitForThenPress('Profile:BackButton', screen)

    await waitFor(() => expect(screen.getByTestId('TokenCounter:AmountOfTokens')).toHaveTextContent('X50'))
    
    expect(checkAccountLogo('dummy_public_id', testAccount.data.id)).toBeTruthy()
})