import EditResource from "@/components/form/EditResource"
import { render, waitFor, screen } from "@testing-library/react-native"
import { checkHasNotifications, checkResourcePresent } from "./datastoreCheck"
import { AppWithSingleScreen, createResourceThroughUI } from "./lib"
import React from "react"
import { cleanupTestAccounts, makeTestAccounts, setAccountAddress, TestAccount } from "./datastoreSetupLib"
import Notifications from "@/components/notifications/Notifications"
import { t } from "@/i18n"
import utc from 'dayjs/plugin/utc'
import dayjs from "dayjs"
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/fr'
dayjs.extend(relativeTime)
dayjs.extend(utc)

let accounts: TestAccount[]

afterEach( async () => {
    await cleanupTestAccounts(accounts)
})

test('Create resource with unconfirmed account', async () => {
    accounts = await makeTestAccounts([{}, {}])

    render(<AppWithSingleScreen component={EditResource} name="editResource" 
        overrideSecureStore={{ get: async () => accounts[0].data.token, set: async () => {}, remove: async () => {} }} />)

    const someDate = new Date(new Date().valueOf() + 1000 * 60 * 60 * 24)
    const title = 'A title for this resource'
    const description = 'A description, potentially long.'

    await createResourceThroughUI(title, description, someDate, screen)

    await checkResourcePresent(accounts[0].info.email, title, description, false, true, false, false, true, false, someDate, [2, 11])
    
    const notifs = await checkHasNotifications(accounts[1].info.email, ['info'])
    const notif = notifs[0]
    
    const notifScreen = render(<AppWithSingleScreen component={Notifications} name="notifications" 
        overrideSecureStore={{ get: async () => accounts[1].data.token, set: async () => {}, remove: async () => {} }} />)

    await waitFor(() => expect(notifScreen.getByTestId(`notifications:${notif.notifId}:Text`)).toBeOnTheScreen())
    expect(notifScreen.getByTestId(`notifications:${notif.notifId}:Text`)).toHaveTextContent(t('completeProcessNotificationDetails'))
    
    const notifOtherAccountScreen = render(<AppWithSingleScreen component={Notifications} name="notifications" 
        overrideSecureStore={{ get: async () => accounts[0].data.token, set: async () => {}, remove: async () => {} }} />)

    const notifsOtherAccount = await checkHasNotifications(accounts[0].info.email, ['info'])
    const notifOtherAccount = notifsOtherAccount[0]
    
    await waitFor(() => expect(notifOtherAccountScreen.getByTestId(`notifications:${notifOtherAccount.notifId}:Text`)).toBeOnTheScreen())
    expect(notifOtherAccountScreen.getByTestId(`notifications:${notifOtherAccount.notifId}:Text`)).toHaveTextContent(t('completeProcessNotificationDetails'))
})

// test('Create resource with notification', async () => {
//     accounts = await makeTestAccounts([{ confirm: true }, {}])

//     render(<AppWithSingleScreen component={EditResource} name="editResource" 
//         overrideSecureStore={{ get: async () => accounts[0].data.token, set: async () => {}, remove: async () => {} }} />)

//     const someDate = new Date(new Date().valueOf() + 1000 * 60 * 60 * 24)
//     const title = 'A title for this resource'
//     const description = 'A description, potentially long.'

//     await createResourceThroughUI(title, description, someDate, screen)

//     await checkResourcePresent(accounts[0].info.email, title, description, false, true, false, false, true, false, someDate, [2, 11])

//     const notifs = await checkHasNotifications(accounts[1].info.email, ['info', 'resource_id'])

//     render(<AppWithSingleScreen component={Notifications} name="notifications" 
//         overrideSecureStore={{ get: async () => accounts[1].data.token, set: async () => {}, remove: async () => {} }} />)

//     await waitFor(() => expect(screen.getByTestId(`notifications:${notifs[0].notifId}:Text`)).toBeOnTheScreen())

//     notifs.forEach(notif => {
//         if(notif.uniquePropName === 'info') {
//             expect(screen.getByTestId(`notifications:${notif.notifId}:Text`)).toHaveTextContent(t('completeProcessNotificationDetails'))
//         } else {
//             expect(screen.getByTestId(`notifications:${notif.notifId}:Text`)).toHaveTextContent(title)
//         }
//     })
// })