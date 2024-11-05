import EditResource from "@/components/form/EditResource"
import { render, waitFor, screen, fireEvent, RenderResult } from "@testing-library/react-native"
import { checkHasNotifications, checkResourcePresent } from "./datastoreCheck"
import { AppWithSingleScreen } from "./lib"
import React from "react"
import { createAndLogIn, deleteAccount, getTestNum } from "./datastoreSetupLib"
import Notifications from "@/components/notifications/Notifications"
import { t } from "@/i18n"
import '@testing-library/react-native/extend-expect'
import utc from 'dayjs/plugin/utc'
import dayjs from "dayjs"
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/fr'
dayjs.extend(relativeTime)
dayjs.extend(utc)

let accountsInTest: {
    email: string, name: string, password: string, token?: string, confirm?: boolean
}[] = []

afterEach(async () => {
    return Promise.all(
        accountsInTest.map(account => deleteAccount(account.email, account.password)))
})

const createAccounts = async () => {
    accountsInTest = await Promise.all(accountsInTest.map(async account => {
        const token = await createAndLogIn(account.email, account.name, account.password, account.confirm)
        account.token = token
        return account
    }))
    //console.log('accountsInTest', accountsInTest)
}

const createResource = async (title: string, description: string, expiration: Date, targetScreen: RenderResult) => {
    await waitFor(() => expect(targetScreen.getByTestId('categories:Button')).toBeOnTheScreen(), { timeout: 5000 })

    fireEvent.changeText(targetScreen.getByTestId('title'), title)
    fireEvent.changeText(targetScreen.getByTestId('description'), description)
    fireEvent.press(targetScreen.getByTestId('nature:isService:Button'))
    fireEvent.press(targetScreen.getByTestId('exchangeType:canBeExchanged:Button'))

    fireEvent.press(targetScreen.getByTestId('expiration:Button'))
    fireEvent(targetScreen.getByTestId('expiration:Picker:date'), 'onChangeText', expiration.valueOf())

    fireEvent.press(targetScreen.getByTestId('categories:Button'))
    await waitFor(() => expect(targetScreen.getByTestId('categories:Modal:ConfirmButton')).toBeOnTheScreen())
    fireEvent.press(targetScreen.getByTestId('categories:Modal:Category:2'))
    fireEvent.press(targetScreen.getByTestId('categories:Modal:Category:11'))
    fireEvent.press(targetScreen.getByTestId('categories:Modal:ConfirmButton'))

    fireEvent.press(targetScreen.getByTestId('submitButton'))

    return waitFor(() => expect(targetScreen.getByTestId('resourceEditionFeedback:Success')).toBeOnTheScreen())
}

test('Create resource with unconfirmed account', async () => {
    const testNum = getTestNum()

    accountsInTest = [
        { email: `me${testNum}@me.com`, name: `me${testNum}`, password: 'Password1!' },
        { email: `me${testNum}-2@me.com`, name: `me${testNum}-2`, password: 'Password1!' },
    ]
    await createAccounts()

    render(<AppWithSingleScreen component={EditResource} name="editResource" 
        overrideSecureStore={{ get: async () => accountsInTest[0].token!, set: async () => {}, remove: async () => {} }} />)

    const someDate = new Date(new Date().valueOf() + 1000 * 60 * 60 * 24)
    const title = 'A title for this resource'
    const description = 'A description, potentially long.'

    await createResource(title, description, someDate, screen)

    await checkResourcePresent(accountsInTest[0].email, title, description, false, true, false, false, true, false, someDate, [2, 11])
    
    const notifs = await checkHasNotifications(accountsInTest[1].email, ['info'])
    const notif = notifs[0]
    
    const notifScreen = render(<AppWithSingleScreen component={Notifications} name="notifications" 
        overrideSecureStore={{ get: async () => accountsInTest[1].token!, set: async () => {}, remove: async () => {} }} />)

    await waitFor(() => expect(notifScreen.getByTestId(`notifications:${notif.notifId}:Text`)).toBeOnTheScreen())
    expect(notifScreen.getByTestId(`notifications:${notif.notifId}:Text`)).toHaveTextContent(t('completeProcessNotificationDetails'))
    
    const notifOtherAccountScreen = render(<AppWithSingleScreen component={Notifications} name="notifications" 
        overrideSecureStore={{ get: async () => accountsInTest[0].token!, set: async () => {}, remove: async () => {} }} />)

    const notifsOtherAccount = await checkHasNotifications(accountsInTest[0].email, ['info'])
    const notifOtherAccount = notifsOtherAccount[0]
    
    await waitFor(() => expect(notifOtherAccountScreen.getByTestId(`notifications:${notifOtherAccount.notifId}:Text`)).toBeOnTheScreen())
    expect(notifOtherAccountScreen.getByTestId(`notifications:${notifOtherAccount.notifId}:Text`)).toHaveTextContent(t('completeProcessNotificationDetails'))
})

test('Create resource with notification', async () => {
    const testNum = getTestNum()

    accountsInTest = [
        { email: `me${testNum}@me.com`, name: `me${testNum}`, password: 'Password1!', confirm: true },
        { email: `me${testNum}-2@me.com`, name: `me${testNum}-2`, password: 'Password1!' },
    ]
    await createAccounts()

    render(<AppWithSingleScreen component={EditResource} name="editResource" 
        overrideSecureStore={{ get: async () => accountsInTest[0].token!, set: async () => {}, remove: async () => {} }} />)

    const someDate = new Date(new Date().valueOf() + 1000 * 60 * 60 * 24)
    const title = 'A title for this resource'
    const description = 'A description, potentially long.'

    await createResource(title, description, someDate, screen)

    await checkResourcePresent(accountsInTest[0].email, title, description, false, true, false, false, true, false, someDate, [2, 11])

    const notifs = await checkHasNotifications(accountsInTest[1].email, ['info', 'resource_id'])

    render(<AppWithSingleScreen component={Notifications} name="notifications" 
        overrideSecureStore={{ get: async () => accountsInTest[1].token!, set: async () => {}, remove: async () => {} }} />)

    await waitFor(() => expect(screen.getByTestId(`notifications:${notifs[0].notifId}:Text`)).toBeOnTheScreen())

    notifs.forEach(notif => {
        if(notif.uniquePropName === 'info') {
            expect(screen.getByTestId(`notifications:${notif.notifId}:Text`)).toHaveTextContent(t('completeProcessNotificationDetails'))
        } else {
            expect(screen.getByTestId(`notifications:${notif.notifId}:Text`)).toHaveTextContent(title)
        }
    })
})