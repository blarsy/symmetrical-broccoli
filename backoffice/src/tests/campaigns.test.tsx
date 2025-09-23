import { render, waitFor } from "@testing-library/react"
import { checkLastNotificationOnAccount, cleanupTestAccounts, createCampaign, executeQuery, fromToday, makeTestAccounts, TestAccount } from "./datastoreSetupLib"
import NotificationsPage from "@/app/webapp/[version]/notifications/page"

let account : TestAccount

const mockUsePathname = jest.fn(() => '/webapp/v0_10/notifications')

jest.mock('next/navigation', () => ({
  usePathname() {
    return mockUsePathname()
  },
  useRouter() {
    return {}
  }
}))

beforeEach(async () => {
    [account] = await makeTestAccounts([{ confirm: true }])

    const in2days = fromToday(2), in1day = fromToday(1), in4days = fromToday(4)
    await createCampaign('test campaign', 'description for test campaign', in2days, 4000, 6, in1day, in4days)

})

test('campaign beginning is announced', async () => {
    await executeQuery('SELECT sb.apply_campaign_announcements()')

    //check that nothing happened on the campaign
    const matches = await executeQuery(`SELECT count(*) as count FROM sb.campaigns WHERE airdrop_done = false AND airdrop_imminent_announced = false AND beginning_announced = false AND id = (SELECT id FROM sb.get_active_campaign())`)
    expect(matches.rowCount).toEqual(1)
    expect(matches.rows[0].count).toEqual('1')

    await executeQuery('update sb.campaigns set beginning = $1 where id = (select id from get_active_campaign())', [new Date(new Date().valueOf() - 100)])

    await executeQuery('SELECT sb.apply_campaign_announcements()')

    //check that campaign beginning was announced
    const matches2 = await executeQuery(`SELECT count(*) as count FROM sb.campaigns WHERE airdrop_done = false AND airdrop_imminent_announced = false AND beginning_announced = true AND id = (SELECT id FROM sb.get_active_campaign())`)
    expect(matches2.rowCount).toEqual(1)
    expect(matches2.rows[0].count).toEqual('1')

    const notifId = await checkLastNotificationOnAccount(account.data.id, parsed => parsed.info === 'CAMPAIGN_BEGUN')

    localStorage.setItem('token', account.data.token)
    const notificationsPage = render(<NotificationsPage />)

     await waitFor(() => expect(notificationsPage.getByTestId(`Notification:${notifId}`)).toBeInTheDocument())
    
})

test('campaign airdrop is announced', async () => {
    await executeQuery('update sb.campaigns set airdrop = $1 where id = (select id from get_active_campaign())', [new Date(fromToday(1).valueOf() - 100)])

    await executeQuery('SELECT sb.apply_campaign_announcements()')

    //check that campaign beginning was announced
    const matches2 = await executeQuery(`SELECT count(*) as count FROM sb.campaigns WHERE airdrop_done = false AND airdrop_imminent_announced = truee AND id = (SELECT id FROM sb.get_active_campaign())`)
    expect(matches2.rowCount).toEqual(1)
    expect(matches2.rows[0].count).toEqual('1')

    const notifId = await checkLastNotificationOnAccount(account.data.id, parsed => parsed.info === 'AIRDROP_SOON')

    localStorage.setItem('token', account.data.token)
    const notificationsPage = render(<NotificationsPage />)

    await waitFor(() => expect(notificationsPage.getByTestId(`Notification:${notifId}`)).toBeInTheDocument())
})

test('campaign airdrop is applied', async () => {
    await executeQuery('update sb.campaigns set airdrop = $1 where id = (select id from get_active_campaign())', [new Date(new Date().valueOf() - 100)])

    await executeQuery('SELECT sb.apply_airdrop()')

    //check that campaign beginning was announced
    const matches2 = await executeQuery(`SELECT count(*) as count FROM sb.campaigns WHERE airdrop_done = true AND id = (SELECT id FROM sb.get_active_campaign())`)
    expect(matches2.rowCount).toEqual(1)
    expect(matches2.rows[0].count).toEqual('1')
})

afterEach(async () => {
    await executeQuery('delete from sb.campaigns where id = (select id from sb.get_active_campaign())')
    return cleanupTestAccounts([account])
})