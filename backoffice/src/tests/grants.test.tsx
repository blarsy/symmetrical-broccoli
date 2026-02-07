import Page from "@/app/webapp/[version]/grant/[id]/page"
import { render, waitFor } from "@testing-library/react"
import { checkAccountTokens, checkLastNotificationOnAccount, checkLastTokenTransactionOnAccount, cleanupTestAccounts, createCampaign, createGrant, createResource, deleteGrant, makeTestAccounts, removeActiveCampaign, TestAccount } from "./datastoreSetupLib"
import { UUID } from "crypto"
import { fromToday } from "@/utils"
import config from "./config"

let grantId: UUID
let account: TestAccount

const mockUsePathname = jest.fn()
jest.mock('next/navigation', () => ({
  usePathname() {
    return mockUsePathname()
  },
useRouter() {
    return {}
  },
  useSearchParams() { return null }
}))

beforeEach(async () => {
    [account] = await makeTestAccounts([ {} ])

    localStorage.setItem('token', account.data.token)
})

test('Grant successful', async () => {
    grantId = await createGrant('grant title', 3000)

    mockUsePathname.mockImplementation(() => `/webapp/${config.version}/grant/${grantId}`)

    const grantPage = render(<Page/>)

    await waitFor(() => expect(grantPage.getByTestId('GrantHitSuccess')).toBeInTheDocument())
    await checkAccountTokens(account.info.email, 3000)
    await checkLastTokenTransactionOnAccount(account.info.email, 3000, 17)
    await checkLastNotificationOnAccount(account.data.id, notif => notif.info === 'GRANT_RECEIVED' && notif.amount === 3000)
})

test('Grant expired', async () => {
    grantId = await createGrant('grant title', 3000, new Date(new Date().valueOf() - 1000 * 60))

    mockUsePathname.mockImplementation(() => `/webapp/${config.version}/grant/${grantId}`)

    const grantPage = render(<Page/>)

    await waitFor(() => expect(grantPage.getByTestId('GrantHitFailure:Message')).toHaveTextContent('expir'))
})

test('Grant reached max', async () => {
    grantId = await createGrant('grant title', 3000, undefined, 0)

    mockUsePathname.mockImplementation(() => `/webapp/${config.version}/grant/${grantId}`)

    const grantPage = render(<Page/>)

    await waitFor(() => expect(grantPage.getByTestId('GrantHitFailure:Message')).toHaveTextContent('maximum'))
})

test('Grant not in whilelist', async () => {
    grantId = await createGrant('grant title', 3000, undefined, undefined, ['bi@dul.be', 'ma@chin.be'])

    mockUsePathname.mockImplementation(() => `/webapp/${config.version}/grant/${grantId}`)

    const grantPage = render(<Page/>)

    await waitFor(() => expect(grantPage.getByTestId('GrantHitFailure:Message')).toHaveTextContent(account.info.email))
})

test('Grant success in whilelist', async () => {
    grantId = await createGrant('grant title', 3000, undefined, undefined, ['bi@dul.be', 'ma@chin.be', account.info.email])

    mockUsePathname.mockImplementation(() => `/webapp/${config.version}/grant/${grantId}`)

    const grantPage = render(<Page/>)

    await waitFor(() => expect(grantPage.getByTestId('GrantHitSuccess')).toBeInTheDocument())
})

test('Grant not in campaign participation', async () => {
    const campaignId = await createCampaign('test campaign', '', fromToday(3), 3000, 5, fromToday(-1), fromToday(10))
    try {
        grantId = await createGrant('grant title', 3000, undefined, undefined, undefined, campaignId)

        mockUsePathname.mockImplementation(() => `/webapp/${config.version}/grant/${grantId}`)

        const grantPage = render(<Page/>)
    
        await waitFor(() => expect(grantPage.getByTestId('GrantHitFailure:Message')).toHaveTextContent('participants'))
    } finally {
        await removeActiveCampaign()
    }
})

test('Grant success in campaign participation', async () => {
    const campaignId = await createCampaign('test campaign', '', fromToday(3), 3000, 5, fromToday(-1), fromToday(10))
    await createResource(account.data.token, `${account.info.name}-t`, 'd', true, false, false, true, true, false, undefined, [2], campaignId)
    try {
        grantId = await createGrant('grant title', 3000, undefined, undefined, undefined, campaignId)

        mockUsePathname.mockImplementation(() => `/webapp/${config.version}/grant/${grantId}`)

        const grantPage = render(<Page/>)
    
        await waitFor(() => expect(grantPage.getByTestId('GrantHitSuccess')).toBeInTheDocument())
    } finally {
        await removeActiveCampaign()
    }
})

afterEach(async () => {
    await deleteGrant(grantId)
    return cleanupTestAccounts([account])
})