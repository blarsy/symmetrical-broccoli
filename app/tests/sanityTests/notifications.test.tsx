import { cleanupTestAccounts, createResourceLowLevel, makeTestAccounts, setAccountTokens, TestAccount } from "./datastoreSetupLib"
import dayjs from "dayjs"
import { checkHasNotifications } from "./datastoreCheck"
import { executeQuery } from "./lib"

let account: TestAccount

beforeEach(async () => {
    [account] = await makeTestAccounts([{ confirm: true }])
})

afterEach(async () => {
    await cleanupTestAccounts([account])
})


test('notification sent to account when low amount of token', async () => {
    await Promise.all([
        createResourceLowLevel({ 
            accountId: account.data.id,  expiration: dayjs(new Date()).add(1, "days").toDate(), 
            created: new Date(), title: `res${account.info.name}` }),
        createResourceLowLevel({ 
            accountId: account.data.id,  expiration: dayjs(new Date()).add(1, "days").toDate(), 
            created: new Date(), title: `res${account.info.name}-1` }),
        createResourceLowLevel({ 
            accountId: account.data.id,  expiration: dayjs(new Date()).add(1, "days").toDate(), 
            created: new Date(), title: `res${account.info.name}-2` }),
        createResourceLowLevel({ 
            accountId: account.data.id,  expiration: dayjs(new Date()).add(1, "days").toDate(), 
            created: new Date(), title: `res${account.info.name}-3` }),
        createResourceLowLevel({ 
            accountId: account.data.id,  expiration: dayjs(new Date()).add(1, "days").toDate(), 
            created: new Date(), title: `res${account.info.name}-4` })
    ])

    await setAccountTokens(account.info.email, 4)

    await executeQuery(`SELECT sb.apply_resources_token_transactions()`)

    const notifs = await checkHasNotifications(account.info.email, ['info', 'info'])
    expect(notifs[1].uniquePropValue).toBe('WARNING_LOW_TOKEN_AMOUNT')
})

test('notification sent to account when resources suspended', async () => {
    await Promise.all([
        createResourceLowLevel({ 
            accountId: account.data.id,  expiration: dayjs(new Date()).add(1, "days").toDate(), 
            created: new Date(), title: `res${account.info.name}` }),
        createResourceLowLevel({ 
            accountId: account.data.id,  expiration: dayjs(new Date()).add(1, "days").toDate(), 
            created: new Date(), title: `res${account.info.name}-1` }),
        createResourceLowLevel({ 
            accountId: account.data.id,  expiration: dayjs(new Date()).add(1, "days").toDate(), 
            created: new Date(), title: `res${account.info.name}-2` }),
        createResourceLowLevel({ 
            accountId: account.data.id,  expiration: dayjs(new Date()).add(1, "days").toDate(), 
            created: new Date(), title: `res${account.info.name}-3` }),
        createResourceLowLevel({ 
            accountId: account.data.id,  expiration: dayjs(new Date()).add(1, "days").toDate(), 
            created: new Date(), title: `res${account.info.name}-4` })
    ])

    await setAccountTokens(account.info.email, 2)

    await executeQuery(`SELECT sb.apply_resources_token_transactions()`)

    const notifs = await checkHasNotifications(account.info.email, ['info', 'info'])
    expect(notifs[1].uniquePropValue).toBe('SOME_RESOURCES_SUSPENDED')
})