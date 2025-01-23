import { fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import { cleanupTestAccounts, makeTestAccounts, simulateActivation, TestAccount } from "./datastoreSetupLib"
import React, { useContext } from "react"
import EditProfile from "@/components/form/EditProfile"
import { checkActivationEmailSent, checkAccountData, checkLinksOnAccount } from "./datastoreCheck"
import Start from "@/components/mainViews/Start"
import { AppContext, AppContextProvider } from "@/components/AppContextProvider"
import '@testing-library/react-native/extend-expect'
import PublicInfo from "@/components/account/PublicInfo"

jest.useFakeTimers()
jest.mock('react-native-paper-dates')

let account: TestAccount
beforeEach(async () => {
    [account] = await makeTestAccounts([{ confirm: true, contributor: true }])
})

afterEach(async () => {
    await cleanupTestAccounts([account])
})

test('edit account data', async () => {
    const newName = `${account.info.name} m`
    render(
        <AppContextProvider>
            <Start splashScreenMinimumDuration={0} overrideSecureStore={{ get: async () => account.data.token, set: async () => {}, remove: async () => {} }}>
                <EditProfile />
            </Start>
        </AppContextProvider>)

    await waitFor(() => expect(screen.getByTestId('name')).toHaveProp('value', account.info.name))
        
    fireEvent.changeText(screen.getByTestId('name'), newName)
    fireEvent.press(screen.getByTestId('save'))

    await waitFor(() => expect(screen.getByTestId('editProfileFeedback:Success')).toBeOnTheScreen())
    expect(screen.getByTestId('emailChangingBanner')).not.toBeVisible()

    await checkAccountData (account.info.email, newName)
})

test('edit account data: email', async () => {
    const newEmail = `new${account.info.email}`
    render(<AppContextProvider>
        <Start splashScreenMinimumDuration={0} overrideSecureStore={{ get: async () => account.data.token, set: async () => {}, remove: async () => {} }}>
            <EditProfile />
        </Start>
    </AppContextProvider>)

    await waitFor(() => expect(screen.getByTestId('email')).toHaveProp('value', account.info.email))
        
    fireEvent.changeText(screen.getByTestId('email'), newEmail)
    fireEvent.press(screen.getByTestId('save'))

    await waitFor(() => expect(screen.getByTestId('editProfileFeedback:Success')).toBeOnTheScreen())
    await waitFor(() => expect(screen.getByTestId('emailChangingBanner')).toBeVisible())

    await checkAccountData (account.info.email, account.info.name)
    const activationCode = await checkActivationEmailSent(newEmail)

    simulateActivation(activationCode)
    
    await checkAccountData(newEmail, account.info.name)
})

const addLink = async (label: string, url: string, type: number) => {
    fireEvent.press(screen.getByTestId('addLinkButton'))
    await waitFor(() => expect(screen.getByTestId('linkModal:label')).toBeOnTheScreen())
    
    fireEvent.changeText(screen.getByTestId('linkModal:label'), label)
    fireEvent.changeText(screen.getByTestId('linkModal:url'), url)
    fireEvent.press(screen.getByTestId(`linkModal:type:${type}`))

    fireEvent.press(screen.getByTestId(`linkModal:doneButton`))
    
    await waitFor(() => expect(screen.queryByTestId(`editLinkModal`)).not.toBeOnTheScreen())
}
const modifyLink = async (label: string, url: string, type: number, idx: number) => {
    fireEvent.press(screen.getByTestId(`link:${idx}:EditButton`))
    await waitFor(() => expect(screen.getByTestId('linkModal:label')).toBeOnTheScreen())
    
    fireEvent.changeText(screen.getByTestId('linkModal:label'), label)
    fireEvent.changeText(screen.getByTestId('linkModal:url'), url)
    fireEvent.press(screen.getByTestId(`linkModal:type:${type}`))

    fireEvent.press(screen.getByTestId(`linkModal:doneButton`))
    
    await waitFor(() => expect(screen.queryByTestId(`editLinkModal`)).not.toBeOnTheScreen())
}
const deleteLink = async (idx: number, numberOfLinksBeforeDeletion: number) => {
    fireEvent.press(screen.getByTestId(`link:${idx}:DeleteButton`))
    //screen.debug()
    await waitFor(() => expect(screen.queryAllByTestId(/link:\d{1,2}:DeleteButton(?!-)/, { exact: true }).length).toEqual(numberOfLinksBeforeDeletion -1))
}

const Dut = () => {
    const appContext = useContext(AppContext)

    return appContext.account && appContext.account.id ? <PublicInfo />
        : <></>
}

test('edit account data: links', async () => {
    const labelLink1 = '1', labelLink2= '2', labelLink3 = '3', labelLink1Bis = '1Bis',
        urlLink1 = 'http://l1.f', urlLink2= 'http://l1.f', urlLink3 = 'http://l3.f', urlLink1Bis = 'http://l1Bis.f',
        typeLink1= 2, typeLink2= 3, typeLink3 = 1, typeLink1Bis = 4

    render(<AppContextProvider>
        <Start splashScreenMinimumDuration={0} overrideSecureStore={{ get: async () => account.data.token, set: async () => {}, remove: async () => {} }}>
            <Dut />
        </Start>
    </AppContextProvider>)

    await waitFor(() => expect(screen.getByTestId('addLinkButton')).toBeOnTheScreen(), { timeout: 10000 })

    await addLink(labelLink1, urlLink1, typeLink1)
    await addLink(labelLink2, urlLink2, typeLink2)
    await addLink(labelLink3, urlLink3, typeLink3)
    await modifyLink(labelLink1Bis, urlLink1Bis, typeLink1Bis, 0)
    await deleteLink(2, 3)

    await checkLinksOnAccount(account.info.email, [
        { label: labelLink1Bis, url: urlLink1Bis, type: typeLink1Bis }, 
        { label: labelLink2, url: urlLink2, type: typeLink2 }])
})