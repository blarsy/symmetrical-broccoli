import { render, screen, waitFor } from "@testing-library/react-native"
import { createAndLogIn, createResource, deleteAccount, getTestNum, setAccountTokens, setResourceData } from "./datastoreSetupLib"
import { AppWithSingleScreen, createResourceThroughUI, daysFromNow, executeQuery, waitForThenPress } from "./lib"
import React from "react"
import Resources from "@/components/mainViews/Resources"
import '@testing-library/react-native/extend-expect'

const testNum = getTestNum()
const email = `me${testNum}@me.com`, password= 'Password1!', name = `me${testNum}`
const resName = `${name}-res`
let res1Id: number
let token: string
beforeEach(async () => {
    token = await createAndLogIn(email, name, password, true, true)
})

afterEach(async () => {
    return deleteAccount(email, password)
})

test('Third ressource consumes a token per day', async() => {
    const expiration = new Date( new Date().valueOf() + (1000 * 60 * 60 * 24) )

    await Promise.all([
        (async() => res1Id = await createResource(token, resName, 'description', true, false, true, true, true, false, expiration, [1]))(),
        createResource(token, resName + '2', 'description2', true, false, true, true, true, false, expiration, [2]),
    ])

    render(<AppWithSingleScreen component={Resources} name="resources" 
        overrideSecureStore={{ get: async () => token, set: async () => {}, remove: async () => {} }} />)

    await waitForThenPress('ResourcesAppendableList:addButton', screen)

    await createResourceThroughUI('some title', 'some description', new Date(new Date().valueOf() + 1000 * 60 * 60 * 24 * 30), screen, false)

    await waitFor(() => expect(screen.getByTestId('Tokens:amount')).toBeOnTheScreen())

    expect(screen.getByTestId('Tokens:amount')).toHaveTextContent('29 Topes')
})

test('Consuming function handles accurately each resource context', async () => {
    // Create:
    // - an account with 2 topes

    await setAccountTokens(email, 30)

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
        createResource(token, resName + 'suspended1', 'description2', true, false, true, true, true, false, notExpired, [2]),
        createResource(token, resName + 'suspended2', 'description2', true, false, true, true, true, false, notExpired, [2]),
        createResource(token, resName + 'suspended3', 'description2', true, false, true, true, true, false, notExpired, [2]),
        createResource(token, resName + 'expired', 'description2', true, false, true, true, true, false, expired, [2]),
        createResource(token, resName + 'mustpay', 'description2', true, false, true, true, true, false, notExpired, [2]),
        createResource(token, resName + 'stillpaid', 'description2', true, false, true, true, true, false, notExpired, [2]),
        createResource(token, resName + 'deleted', 'description2', true, false, true, true, true, false, notExpired, [2]),
        createResource(token, resName + 'new', 'description2', true, false, true, true, true, false, notExpired, [2]),
        createResource(token, resName + 'old', 'description2', true, false, true, true, true, false, notExpired, [2])
    ]) 

    await Promise.all([
        setResourceData(resIds[0], { suspended: daysFromNow(-10), paid_until: daysFromNow(-2), created: daysFromNow(-12) }),
        setResourceData(resIds[1], { suspended: daysFromNow(-5), paid_until: daysFromNow(-1), created: daysFromNow(-7) }),
        setResourceData(resIds[2], { suspended: daysFromNow(-2), paid_until: daysFromNow(-1), created: daysFromNow(-15) }),
        setResourceData(resIds[4], { paid_until: daysFromNow(-1), created: daysFromNow(-2)  }),
        setResourceData(resIds[5], { paid_until: daysFromNow(0.1) }),
        setResourceData(resIds[6], { deleted: daysFromNow(-10) }),
        setResourceData(resIds[8], { created: daysFromNow(-3), paid_until: new Date() })
    ])

    await setAccountTokens(email, 2)

    await executeQuery(`SELECT sb.apply_resources_consumption()`)

    const resAfterActState = await executeQuery(`SELECT id, title,suspended, deleted, paid_until, created
        FROM sb.resources r
        WHERE r.account_id = (SELECT id FROM sb.accounts WHERE email = LOWER($1)) ORDER BY created`, [email])

    // The 2 oldest, not expired, not deleted (aka "active") resources are free, so any suspended status should have been lifted
    checkResourceSpecialFields(resAfterActState.rows, resIds[0], -2, false)
    checkResourceSpecialFields(resAfterActState.rows, resIds[1], 1, false)
    // The 2 next active resources should have a paid_date prolonged by 1 day,
    // while the expired resource should not have been modified
    checkResourceSpecialFields(resAfterActState.rows, resIds[2], -1, false)
    checkResourceSpecialFields(resAfterActState.rows, resIds[3], 0, false)
    // As the accout should have run out of token, nest active resource should have been suspended
    checkResourceSpecialFields(resAfterActState.rows, resIds[4], -1, true)
    // The still paid valid resource should not have been modified
    checkResourceSpecialFields(resAfterActState.rows, resIds[5], -0.1, false)
    // The deleted resource should not have been modified
    checkResourceSpecialFields(resAfterActState.rows, resIds[6], 0, false)
    checkResourceSpecialFields(resAfterActState.rows, resIds[1], -1, false)
    // The existing resource is still in paid period and should not have been changed
    checkResourceSpecialFields(resAfterActState.rows, resIds[8], 0, false)
})

const checkResourceSpecialFields = (rows: any[], resId: number, paidUntilWithinDays: number, isSuspended: boolean) => {
    const res = rows.find(row => row.id === resId)

    if(!res)
        throw new Error(`resource with id ${resId} not found.`)

    if(res.paid_until < daysFromNow(paidUntilWithinDays - 0.01))
        throw new Error(`paidUntil of resource with id ${resId} is ${res.paid_until}, but was expected to be roughly ${paidUntilWithinDays} days from now.`)

    if(!!res.suspended != isSuspended)
        throw new Error(`expected suspended of resource with id ${resId} to be ${isSuspended}, but was ${res.suspended}.`)
}