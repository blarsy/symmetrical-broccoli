import { fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import { cleanupTestAccounts, createResource, createResourceLowLevel, makeTestAccounts, setAccountTokens, TestAccount } from "./datastoreSetupLib"
import { AppWithSingleScreen, createResourceThroughUI, executeQuery, waitForThenPress } from "./lib"
import React from "react"
import Resources from "@/components/mainViews/Resources"
import { daysFromNow } from "@/lib/utils"

let res1Id: number, account: TestAccount, resName: string
beforeEach(async () => {
    [account] = await makeTestAccounts([{ confirm: true, contributor: true }])
    resName = `${account.info.name}-res`
})

afterEach(async () => {
    await cleanupTestAccounts([account])
})

test('Third ressource consumes a token per day', async() => {
    const expiration = new Date( new Date().valueOf() + (1000 * 60 * 60 * 24) )

    await Promise.all([
        (async() => res1Id = await createResource(account.data.token, resName, 'description', true, false, true, true, true, false, expiration, [1]))(),
        createResource(account.data.token, resName + '2', 'description2', true, false, true, true, true, false, expiration, [2]),
    ])

    render(<AppWithSingleScreen component={Resources} name="resources" 
        overrideSecureStore={{ get: async () => account.data.token, set: async () => {}, remove: async () => {} }} />)

    await waitForThenPress('ResourcesAppendableList:addButton', screen)

    await createResourceThroughUI('some title', 'some description', new Date(new Date().valueOf() + 1000 * 60 * 60 * 24 * 30), screen, false)

    fireEvent.press(screen.getByTestId('TokenCounter'))

    await waitForThenPress('HistoryAccordion:Button', screen)

    await waitFor(() => expect(screen.getByTestId('tokenHistory:0:movement')).toHaveTextContent('-1'), { timeout: 5000 })
    expect(screen.getByTestId('tokenHistory:0:title')).toHaveTextContent('Topes consommés par les ressources')
    expect(screen.getByTestId('tokenHistory:1:movement')).toHaveTextContent('+30')
    expect(screen.getByTestId('tokenHistory:1:title')).toHaveTextContent('Mode contribution activé')
    expect(screen.getByTestId('AmountOfTokens')).toHaveTextContent('29')
})

test('Consuming function handles accurately each resource context', async () => {
    // Create:
    // - an account with 2 topes

    const notExpired = daysFromNow(1)
    const expired = daysFromNow(-1)

    // - 3 suspended resources
    // - 1 expired resource
    // - 1 resource whose paidUntil has elapsed
    // - 1 resource whose paidUntil is still good to go
    // - 1 deleted resource
    // - 1 new resource
    // - 2 existing, non-expired resources
    const resIds = await Promise.all([
        createResourceLowLevel({ accountId: account.data.id, title: resName + 'suspended1', description: 'description', isProduct: true, isService: false, canBeDelivered: true, canBeTakenAway: true, canBeExchanged: true, canBeGifted: false, expiration: notExpired, suspended: daysFromNow(-10), paidUntil: daysFromNow(-2), created: daysFromNow(-12) }),
        createResourceLowLevel({ accountId: account.data.id, title: resName + 'suspended2', description: 'description', isProduct: true, isService: false, canBeDelivered: true, canBeTakenAway: true, canBeExchanged: true, canBeGifted: false, expiration: notExpired, suspended: daysFromNow(-5), paidUntil: daysFromNow(-1), created: daysFromNow(-7) }),
        createResourceLowLevel({ accountId: account.data.id, title: resName + 'suspended3', description: 'description', isProduct: true, isService: false, canBeDelivered: true, canBeTakenAway: true, canBeExchanged: true, canBeGifted: false, expiration: notExpired, suspended: daysFromNow(-2), paidUntil: daysFromNow(-1), created: daysFromNow(-15) }),
        createResourceLowLevel({ accountId: account.data.id, title: resName + 'expired', description: 'description', isProduct: true, isService: false, canBeDelivered: true, canBeTakenAway: true, canBeExchanged: true, canBeGifted: false, expiration: expired }),
        createResourceLowLevel({ accountId: account.data.id, title: resName + 'mustpay', description: 'description', isProduct: true, isService: false, canBeDelivered: true, canBeTakenAway: true, canBeExchanged: true, canBeGifted: false, expiration: notExpired, paidUntil: daysFromNow(-1), created: daysFromNow(-2) }),
        createResourceLowLevel({ accountId: account.data.id, title: resName + 'stillpaid', description: 'description', isProduct: true, isService: false, canBeDelivered: true, canBeTakenAway: true, canBeExchanged: true, canBeGifted: false, expiration: notExpired, paidUntil: daysFromNow(0.1) }),
        createResourceLowLevel({ accountId: account.data.id, title: resName + 'deleted', description: 'description', isProduct: true, isService: false, canBeDelivered: true, canBeTakenAway: true, canBeExchanged: true, canBeGifted: false, expiration: notExpired, deleted: daysFromNow(-10) }),
        createResourceLowLevel({ accountId: account.data.id, title: resName + 'new', description: 'description', isProduct: true, isService: false, canBeDelivered: true, canBeTakenAway: true, canBeExchanged: true, canBeGifted: false, expiration: notExpired, deleted: daysFromNow(-10) }),
        createResourceLowLevel({ accountId: account.data.id, title: resName + 'old', description: 'description', isProduct: true, isService: false, canBeDelivered: true, canBeTakenAway: true, canBeExchanged: true, canBeGifted: false, expiration: notExpired, created: daysFromNow(-3), paidUntil: new Date() }),
    ])

    //Trigger all the rewards
    await executeQuery(`SELECT sb.apply_account_resources_rewards(${account.data.id})`)
    //await executeQuery(`SELECT sb.apply_resources_token_transactions()`)

    //Set the amount of tokens artificially, so that some suspensions will take place
    await setAccountTokens(account.info.email, 2)

    await executeQuery(`SELECT sb.apply_resources_token_transactions()`)

    const resAfterActState = await executeQuery(`SELECT id, title,suspended, deleted, paid_until, created
        FROM sb.resources r
        WHERE r.account_id = (SELECT id FROM sb.accounts WHERE email = LOWER($1)) ORDER BY created`, [account.info.email])

    // The 2 oldest, not expired, not deleted (aka "active") resources are free, so any suspended status should have been lifted
    checkResourceSpecialFields(resAfterActState.rows, resIds[0], -2, false)
    checkResourceSpecialFields(resAfterActState.rows, resIds[1], 1, false)
    // The 2 next active resources should have a paid_date prolonged by 1 day,
    // while the expired resource should not have been modified
    checkResourceSpecialFields(resAfterActState.rows, resIds[2], -1, false)
    checkResourceSpecialFields(resAfterActState.rows, resIds[3], null, false)
    // As the accout should have run out of token, next active resource should have been suspended
    checkResourceSpecialFields(resAfterActState.rows, resIds[4], -1, true)
    // The still paid valid resource should not have been modified
    checkResourceSpecialFields(resAfterActState.rows, resIds[5], -0.1, false)
    // The deleted resource should not have been modified
    checkResourceSpecialFields(resAfterActState.rows, resIds[6], null, false)
    checkResourceSpecialFields(resAfterActState.rows, resIds[1], -1, false)
    // The existing resource is still in paid period and should not have been changed
    checkResourceSpecialFields(resAfterActState.rows, resIds[8], 0, false)

})

const checkResourceSpecialFields = (rows: any[], resId: number, paidUntilWithinDays: number | null, isSuspended: boolean) => {
    const res = rows.find(row => row.id === resId)

    if(!res)
        throw new Error(`resource with id ${resId} not found.`)

    if(paidUntilWithinDays !== null) {
        if(res.paid_until < daysFromNow(paidUntilWithinDays - 0.01))
            throw new Error(`paidUntil of resource with id ${resId} is ${res.paid_until}, but was expected to be roughly ${paidUntilWithinDays} days from now.`)
    } else {
        if(res.paid_until) {
            throw new Error(`paidUntil of resource with id ${resId} is ${res.paid_until}, but was expected to be null.`)
        }
    }

    if(!!res.suspended != isSuspended)
        throw new Error(`expected suspended of resource with id ${resId} to be ${isSuspended}, but was ${res.suspended}.`)
}