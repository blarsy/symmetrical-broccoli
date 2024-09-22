import RegisterForm from '@/components/form/RegisterForm'
import { getApolloClient } from '@/lib/apolloClient'
import { ApolloProvider } from '@apollo/client'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-native-paper'
import { deleteAccount } from './datastoreSetupLib'

test('register new user', async () => {
    const email = 'me4@me.com', password= 'Password1!', name= 'me4'
    await deleteAccount(email, password)

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
    
    await waitFor(() => expect(successCb.mock.calls.length).toBe(1))

    await checkAllAccountDataCreated (email)
})