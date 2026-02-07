import React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import { AppWithScreens, waitForThenPress } from "./lib"
import { SearchResults } from "@/components/mainViews/Search"
import { cleanupTestAccounts, createResource, makeTestAccounts, TestAccount } from "./datastoreSetupLib"
import ViewResource from "@/components/resources/ViewResource"
import ViewAccount from "@/components/mainViews/ViewAccount"
import { checkANotificationExists, checkTokenTransactionExists, getTokenAmounts } from "./datastoreCheck"
import relativeTime from 'dayjs/plugin/relativeTime'
import dayjs from "dayjs"

dayjs.extend(relativeTime)

let account: TestAccount, account2: TestAccount, res1Id: string, resName: string

beforeEach(async () => {
    [account, account2] = await makeTestAccounts([{ confirm: true, contributor: true, initialTokenAmount: 10  }, { confirm: true, contributor: true, initialTokenAmount: 3}])

    resName = `${account.info.name}-res`
    await Promise.all([
        res1Id = await createResource(account2.data.token, resName, 'description', true, false, true, true, true, false, new Date(new Date().valueOf() + 1000 * 60 * 60 * 24 * 30), [1])
    ])
})

afterAll(async () => {
    await cleanupTestAccounts([account])
})

test('Send Topes', async () => {
    const amountToSend = 3

    const originalTokenAmounts = await getTokenAmounts([ account.data.id, account2.data.id ])

    render(<AppWithScreens screens={[
        { component: SearchResults, name: 'searchResult' }, 
        { component: ViewResource, name: 'viewResource' },
        { component: ViewAccount, name: 'viewAccount' }
    ]} overrideSecureStore={{ get: async () => account.data.token, set: async () => {}, remove: async () => {} }} />)

    await waitFor(() => expect(screen.getByTestId('categories:Button')).toBeOnTheScreen(), { timeout: 5000 })

    fireEvent.changeText(screen.getByTestId('searchText'), `${resName}`)

    await waitFor(() => expect(screen.getByTestId(`FoundResource:${res1Id}:Title`)).toBeOnTheScreen())
    
    fireEvent.press(screen.getByTestId(`FoundResource:${res1Id}:ViewResourceButton`))

    await waitForThenPress('viewResource:viewButton', screen)
    //await waitFor(() => expect(screen.getByTestId('viewResource:viewButton')).toBeOnTheScreen())

    await waitForThenPress('SendTokens', screen)
    //fireEvent.press(screen.getByTestId('viewResource:SendTokens'))

    await waitFor(() => expect(screen.getByTestId('sendTokensDialog:AmountToSend')).toBeOnTheScreen())

    fireEvent.changeText(screen.getByTestId('sendTokensDialog:AmountToSend'), amountToSend.toLocaleString())
    fireEvent.press(screen.getByTestId('sendTokensDialog:ConfirmButton'))

    await waitFor(() => expect(screen.queryByTestId('sendTokensDialog:AmountToSend')).not.toBeOnTheScreen())

    expect(await checkANotificationExists(account.info.email, data => data && data.info === 'TOKENS_SENT' && data.info.amountSent === amountToSend && data.info.toAccount === account2.info.name))
    expect(await checkANotificationExists(account2.info.email, data => data && data.info === 'TOKENS_RECEIVED' && data.info.amountSent === amountToSend && data.info.fromAccount === account.info.name))

    const newTokenAmounts = await getTokenAmounts([account.data.id, account2.data.id])
    expect(newTokenAmounts[account.data.id]).toBe(originalTokenAmounts[account.data.id] - amountToSend)
    expect(newTokenAmounts[account2.data.id]).toBe(originalTokenAmounts[account2.data.id] + amountToSend)

    expect(await checkTokenTransactionExists(account.data.id, 8, amountToSend, account2.data.id))
    expect(await checkTokenTransactionExists(account2.data.id, 9, amountToSend, account.data.id))
})