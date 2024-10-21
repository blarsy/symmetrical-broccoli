import EditResource from "@/components/form/EditResource"
import { render, waitFor, screen, fireEvent } from "@testing-library/react-native"
import { checkLastNotificationExists, checkResourcePresent } from "./datastoreCheck"
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

const testNum = getTestNum()
const email = `me${testNum}@me.com`, emailAccount2 = `me${testNum}-2@me.com`, password= 'Password1!'
const name = `me${testNum}`, name2 = `me${testNum}-2`
let tokens: string[]

afterEach(async () => {
    await Promise.all([
        deleteAccount(email, password),
        deleteAccount(emailAccount2, password)
    ])
})

beforeEach(async () => {
    tokens = await Promise.all([
        createAndLogIn(email, name, password),
        createAndLogIn(emailAccount2, name2, password)
    ]) 
})

test('Create resource', async () => {
    render(<AppWithSingleScreen component={EditResource} name="editResource" 
        overrideSecureStore={{ get: async () => tokens[0], set: async () => {}, remove: async () => {} }} />)

    const someDate = new Date(new Date().valueOf() + 1000 * 60 * 60 * 24)
    const title = 'A title for this resource'
    const description = 'A description, potentially long.'

    await waitFor(() => expect(screen.getByTestId('categories:Button')).toBeOnTheScreen())

    fireEvent.changeText(screen.getByTestId('title'), title)
    fireEvent.changeText(screen.getByTestId('description'), description)
    fireEvent.press(screen.getByTestId('nature:isService:Button'))
    fireEvent.press(screen.getByTestId('exchangeType:canBeExchanged:Button'))

    fireEvent.press(screen.getByTestId('expiration:Button'))
    fireEvent(screen.getByTestId('expiration:Picker:date'), 'onChangeText', someDate.valueOf())

    fireEvent.press(screen.getByTestId('categories:Button'))
    await waitFor(() => expect(screen.getByTestId('categories:Modal:ConfirmButton')).toBeOnTheScreen())
    fireEvent.press(screen.getByTestId('categories:Modal:Category:2'))
    fireEvent.press(screen.getByTestId('categories:Modal:Category:11'))
    fireEvent.press(screen.getByTestId('categories:Modal:ConfirmButton'))

    fireEvent.press(screen.getByTestId('submitButton'))

    await waitFor(() => expect(screen.getByTestId('resourceEditionFeedback:Success')).toBeOnTheScreen())

    await checkResourcePresent(email, title, description, false, true, false, false, true, false, someDate, [2, 11])

    const notif = await checkLastNotificationExists(emailAccount2)
    render(<AppWithSingleScreen component={Notifications} name="notifications" 
        overrideSecureStore={{ get: async () => tokens[1], set: async () => {}, remove: async () => {} }} />)

    await waitFor(() => expect(screen.getByTestId(`notifications:${notif.id}:Text`)).toBeOnTheScreen())
    expect(screen.getByTestId(`notifications:${notif.id}:Text`)).toHaveTextContent(t('completeProcessNotificationDetails'))
}, 10000)