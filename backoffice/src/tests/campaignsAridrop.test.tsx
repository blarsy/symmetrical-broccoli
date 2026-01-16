import { fromToday } from "@/utils"
import { checkAccountTokens, checkLastNotificationOnAccount, cleanupTestAccounts, createCampaign, createResource, executeQuery, makeTestAccounts, removeActiveCampaign, TestAccount } from "./datastoreSetupLib"
import config from './config'

let accounts : TestAccount[]
let account1: TestAccount, account2: TestAccount, account3: TestAccount

jest.mock('next/navigation', () => ({
  usePathname() {
    return `/webapp/${config.version}/notifications`
  },
  useRouter() {
    return {}
  },
  useSearchParams() { return null }
}))

beforeEach(async () => {
    accounts = [account1, account2, account3] = await makeTestAccounts([{ confirm: true, contributor: true, initialTokenAmount: 30 },{ confirm: true, contributor: true, initialTokenAmount: 30 },{ confirm: true, contributor: true }])

    const campaignId = await createCampaign('test campaign airdrop', 'description for test campaign airdrop', new Date(new Date().valueOf() - 100), 5000, 6, fromToday(-2),  fromToday(4))

    // account 0 creates 3 resources unrelated to the campaign
    await createResource(account1.data.token, `${account1.info.name}-u1`, 'd', true, false, false, true, true, false, undefined, [2])
    await createResource(account1.data.token, `${account1.info.name}-u2`, 'd', true, false, false, true, true, false, undefined, [2])
    await createResource(account1.data.token, `${account1.info.name}-u3`, 'd', true, false, false, true, true, false, undefined, [2])
    
    // account 1 creates 1 resource related, 2 unrelated
    await createResource(account2.data.token, `${account2.info.name}-u1`, 'd', true, false, false, true, true, false, undefined, [2])
    await createResource(account2.data.token, `${account2.info.name}-r2`, 'd', true, false, false, true, true, false, undefined, [2], campaignId)
    await createResource(account2.data.token, `${account2.info.name}-u3`, 'd', true, false, false, true, true, false, undefined, [2])

    // account 2 creates 2 related, 2 unrelated
    await createResource(account3.data.token, `${account3.info.name}-r1`, 'd', true, false, false, true, true, false, undefined, [2], campaignId)
    await createResource(account3.data.token, `${account3.info.name}-r2`, 'd', true, false, false, true, true, false, undefined, [2], campaignId)
    await createResource(account3.data.token, `${account3.info.name}-u3`, 'd', true, false, false, true, true, false, undefined, [2])

})

test('campaign airdrop is distributed', async () => {
    await executeQuery('UPDATE sb.campaigns SET airdrop = $1 WHERE id = (SELECT id FROM get_active_campaign())', [new Date(new Date().valueOf() - 100)])

    await executeQuery('SELECT sb.apply_airdrop()')

    await checkLastNotificationOnAccount(account1.data.id, parsed => parsed.info != 'AIRDROP_RECEIVED')
    await checkLastNotificationOnAccount(account2.data.id, parsed => parsed.info != 'AIRDROP_RECEIVED')
    await checkLastNotificationOnAccount(account3.data.id, parsed => parsed.info === 'AIRDROP_RECEIVED')

    const match = await executeQuery(`SELECT count(*) as count FROM sb.campaigns WHERE airdrop_done = true AND id = (SELECT id FROM sb.get_active_campaign())`)
    expect(match.rowCount).toEqual(1)
    expect(match.rows[0].count).toEqual('1')

    await checkAccountTokens(account1.info.email, 30)
    await checkAccountTokens(account2.info.email, 30)
    await checkAccountTokens(account3.info.email, 5000)

})

afterEach(async () => {
    await removeActiveCampaign()
    return cleanupTestAccounts(accounts)
})