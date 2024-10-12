import RegisterForm from '@/components/form/RegisterForm'
import { getApolloClient } from '@/lib/apolloClient'
import { ApolloProvider } from '@apollo/client'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import '@testing-library/react-native/extend-expect'
import React from 'react'
import { Provider } from 'react-native-paper'
import { deleteAccount, getTestNum, simulateActivation,  } from './datastoreSetupLib'
import { checkAccountActivated, checkActivationEmailSent, checkAllAccountDataCreated } from './datastoreCheck'
import { AppContextProvider } from '@/components/AppContextProvider'
import Start from '@/components/mainViews/Start'
import MainNavigator from '@/components/mainViews/MainNavigator'
import { RouteProps } from '@/lib/utils'
import DealBoard from '@/components/mainViews/DealBoard'
import { ISecureStore } from '@/lib/secureStore'

jest.useFakeTimers()

const testNum = getTestNum()
const email = `me${testNum}@me.com`, password= 'Password1!'

afterAll(async () => {
    await deleteAccount(email, password)
})

test('register new user', async () => {
    const name= `me${testNum}`

    const successCb = jest.fn()
    const e = render(<Provider>
        <ApolloProvider client={getApolloClient('')}>
            <RegisterForm
                onAccountRegistrationRequired={() => {}} 
                toggleRegistering={() => {}}
                onAccountRegistered={successCb}/>
        </ApolloProvider>
    </Provider>)

    fireEvent.changeText(e.getByTestId('name'), name)
    fireEvent.changeText(e.getByTestId('email'), email)
    fireEvent.changeText(e.getByTestId('password'), password)
    fireEvent.changeText(e.getByTestId('repeatPassword'), password)
    fireEvent.press(e.getByTestId('ok'))
    
    await waitFor(() => expect(successCb.mock.calls.length).toBe(1), { timeout: 8000 })

    await checkAllAccountDataCreated (email)

    const activationCode = await checkActivationEmailSent(email)

    simulateActivation(activationCode)
    
    await checkAccountActivated(email)
}, 10000)


const EmptyComponent = () => <></>
const Dut = (p: RouteProps) => <DealBoard {...p} tabs={[{ 
  name: 'test', 
  component: EmptyComponent
}]} />

let currentToken = ''
const inMemoryStore: ISecureStore = {
    get: async () => currentToken,
    set: async (val) => { currentToken = val },
    remove: async () => { currentToken = '' }
}

test('can log in and log out to new account', async() => {
    const e = render(<AppContextProvider>
        <Start splashScreenMinimumDuration={0} overrideSecureStore={inMemoryStore}>
            <MainNavigator />
        </Start>
    </AppContextProvider>)

    await waitFor(() => expect(e.getByTestId('openLoginScreen')).toBeOnTheScreen())

    fireEvent.press(e.getByTestId('openLoginScreen'))

    await waitFor(() => expect(e.getByTestId('email')).toBeOnTheScreen())
    fireEvent.changeText(e.getByTestId('email'), email)
    fireEvent.changeText(e.getByTestId('password'), password)
    
    fireEvent.press(e.getByTestId('login'))

    await waitFor(() => expect(e.getByTestId('openProfile')).toBeOnTheScreen())

    fireEvent.press(e.getByTestId('openProfile'))

    await waitFor(() => expect(e.getByTestId('logout')).toBeOnTheScreen())

    fireEvent.press(e.getByTestId('logout'))
    
    await waitFor(() => expect(e.getByTestId('openLoginScreen')).toBeOnTheScreen())
})