import RegisterForm from '@/components/form/RegisterForm'
import { getApolloClient } from '@/lib/apolloClient'
import { ApolloProvider } from '@apollo/client'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-native-paper'
import { authenticate, deleteAccount, getTestNum, simulateActivation,  } from './datastoreSetupLib'
import { checkAccountActivated, checkActivationEmailSent, checkAllAccountDataCreated, checkLastNotificationExists } from './datastoreCheck'
import { AppContextProvider } from '@/components/AppContextProvider'
import Start from '@/components/mainViews/Start'
import MainNavigator from '@/components/mainViews/MainNavigator'
import { t } from '@/i18n'
import { AppWithSingleScreen, checkBadgeNumeric } from './lib'
import Notifications from '@/components/notifications/Notifications'
import utc from 'dayjs/plugin/utc'
import dayjs from "dayjs"
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/fr'
dayjs.extend(relativeTime)
dayjs.extend(utc)

jest.useRealTimers()

const testNum = getTestNum()
const email = `me${testNum}@me.com`, password= 'Password1!'

afterAll(async () => {
    await deleteAccount(email, password)
})

test('register new user, then log in and out', async () => {
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
    console.log('activation success')

    const main = render(<AppContextProvider>
        <Start splashScreenMinimumDuration={0} overrideVersionChecker={() => true}>
            <MainNavigator />
        </Start>
    </AppContextProvider>)

    await waitFor(() => expect(main.getByTestId('Start')).toBeOnTheScreen())
    await waitFor(() => expect(main.getByTestId('openLoginScreen')).toBeOnTheScreen())
    console.log('Login screen opened')

    fireEvent.press(main.getByTestId('openLoginScreen'))

    await waitFor(() => expect(main.getByTestId('email')).toBeOnTheScreen())
    fireEvent.changeText(main.getByTestId('email'), email)
    fireEvent.changeText(main.getByTestId('password'), password)
    
    fireEvent.press(main.getByTestId('login'))
    
    await waitFor(() => expect(main.getByTestId('openProfile')).toBeOnTheScreen())
    console.log('Login on screen success')
    await checkBadgeNumeric('notificationUnreads', main)

    fireEvent.press(main.getByTestId('openProfile'))

    await waitFor(() => expect(main.getByTestId('logout')).toBeOnTheScreen())

    fireEvent.press(main.getByTestId('logout'))
    
    await waitFor(() => expect(main.getByTestId('openLoginScreen')).toBeOnTheScreen())
    console.log('Logout on screen success')

    const notif = await checkLastNotificationExists(email)
    const token = await authenticate(email, password)
    
    const notifScreen = render(<AppWithSingleScreen component={Notifications} name="notifications" 
        overrideSecureStore={{ get: async () => token, set: async () => {}, remove: async () => {} }} />)

    await waitFor(() => expect(notifScreen.getByTestId(`notifications:${notif.id}:Text`)).toBeOnTheScreen())
    expect(notifScreen.getByTestId(`notifications:${notif.id}:Text`)).toHaveTextContent(t('completeProcessNotificationDetails'))

})