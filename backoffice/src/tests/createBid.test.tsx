import '@testing-library/jest-dom'
import { render, waitFor } from '@testing-library/react'
import userEvent, { UserEvent } from '@testing-library/user-event'
import dayjs from "dayjs"
import { checkLastNotificationOnAccount, cleanupTestAccounts, createResource, executeQuery, makeTestAccounts, TestAccount, waitForAndClick } from "./datastoreSetupLib"
import BidsPage from "@/app/webapp/[version]/bids/page"
import ViewResourcePage from "@/components/resources/ViewResourcePage"
import NotifsPage from "@/app/webapp/[version]/notifications/page"
import ContribPage from "@/app/webapp/[version]/profile/tokens/page"

let resourceId: number
let accounts: TestAccount[]
let resourceTitle: string

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
    //create 2 accounts
    accounts = await makeTestAccounts([{ confirm: true, contributor: true }, { confirm: true, contributor: true, initialTokenAmount: 30 }])
    //create resource on account 1
    resourceTitle = `Test res ${accounts[0].info.name}`
    resourceId = await createResource(accounts[0].data.token, resourceTitle, 'desc', true, true, true, false, true, false, dayjs().add(10, "days").toDate(), [1])
})

const check1ActiveBidOnResource = async(resourceId: number) => {
    const res = await executeQuery(`SELECT id FROM sb.bids WHERE resource_id = ($1) AND deleted IS NULL AND accepted IS NULL AND refused IS NULL AND valid_until > NOW()`, [resourceId])
    expect(res.rowCount === 1)
    return res.rows[0].id
}

const checkLastTokenTransactionOnAccount = async(accountId: number, expectedMovement: number, expectedTypeId: number) => {
    const res = await executeQuery(`SELECT id FROM sb.accounts_token_transactions
        WHERE account_id = ($1) AND token_transaction_type_id = ($2) and movement = ($3)
        ORDER BY id desc 
        LIMIT 1`, [accountId, expectedTypeId, expectedMovement])

    return res.rows[0].id
}

const checkBidWasAccepted = async (bidId: number) => {
    const res = await executeQuery(`SELECT id FROM sb.bids WHERE id=($1) AND accepted IS NOT NULL`, [bidId])

    if(res.rowCount != 1) throw new Error(`Bid ${bidId} was not accepted`)
}

const checkBidWasRefused = async (bidId: number) => {
    const res = await executeQuery(`SELECT id FROM sb.bids WHERE id=($1) AND refused IS NOT NULL`, [bidId])

    if(res.rowCount != 1) throw new Error(`Bid ${bidId} was not refused`)
}

const checkBidWasDeleted = async (bidId: number) => {
    const res = await executeQuery(`SELECT id FROM sb.bids WHERE id=($1) AND deleted IS NOT NULL`, [bidId])

    if(res.rowCount != 1) throw new Error(`Bid ${bidId} was not deleted`)
}

const createBidUsingUi = async (token: string, event: UserEvent) => {
    //create bid on resource from account 2
    mockUsePathname.mockImplementation(() => `/webapp/v0_10/view/${resourceId}`)
    localStorage.setItem('token', token)
    const viewResPage = render(<ViewResourcePage/>)

    await waitForAndClick('BidButton', event, viewResPage)

    await waitFor(() => expect(viewResPage.getByTestId('AmountOfTokenField')).toBeInTheDocument())
    await event.type(viewResPage.getByTestId('AmountOfTokenField'), '20')
    
    await event.click(viewResPage.getByTestId('CreateBidButton'))
    await waitFor(() => expect(viewResPage.getByTestId('CreateBidSuccess')).toBeInTheDocument())
        
    return viewResPage

}

test('create a bid', async () => {
    const event = userEvent.setup()
    //create bid on resource from account 2
    const viewResPage = await createBidUsingUi(accounts[1].data.token, event)

    //Check tokens amount updated
    await waitFor(() => expect(viewResPage.getByTestId('TokenCounter')).toHaveTextContent('10'))
    mockUsePathname.mockImplementation(() => `/webapp/v0_10/bids`)
    
    const bidId = await check1ActiveBidOnResource(resourceId)
    const transactionId = await checkLastTokenTransactionOnAccount(accounts[1].data.id, -20, 10)

    const account1Bidpage = render(<BidsPage />)
    await waitFor(() => expect(account1Bidpage.getByTestId(`BidSent:${bidId}`)).toBeInTheDocument())
    
    const contribPage = render(<ContribPage />)
    await waitFor(() => expect(contribPage.getByTestId(`Transaction:${transactionId}`)).toBeInTheDocument())
    
    localStorage.setItem('token', accounts[0].data.token)
    const account0bidPage = render(<BidsPage />)
    await waitFor(() => expect(account0bidPage.getByTestId(`BidReceived:${bidId}`)).toBeInTheDocument())
    
    const notifId = await checkLastNotificationOnAccount(accounts[0].data.id, 
        parsed => parsed.info === 'BID_RECEIVED' && parsed.resourceId === resourceId && 
        parsed.resourceTitle === resourceTitle && parsed.receivedFrom === accounts[1].info.name)
    const account0NotifPage = render(<NotifsPage />)

    await waitFor(() => expect(account0NotifPage.getByTestId(`Notification:${notifId}`)).toBeInTheDocument())
}, 10000)

test('accept a bid', async () => {
    const event = userEvent.setup()
    //create bid on resource from account 2
    const viewResourcePage = await createBidUsingUi(accounts[1].data.token, event)
    viewResourcePage.unmount()
    const bidId = await check1ActiveBidOnResource(resourceId)

    localStorage.setItem('token', accounts[0].data.token)
    const account0bidPage = render(<BidsPage />)

    await waitForAndClick(`BidReceived:${bidId}:AcceptButton`, event, account0bidPage)
    await waitForAndClick(`BidReceived:${bidId}:ConfirmDialog:ConfirmButton`, event, account0bidPage)
    await waitFor(() => expect(account0bidPage.queryByTestId(`BidReceived:${bidId}:ConfirmDialog:ConfirmButton`)).not.toBeInTheDocument())

    //Token amount changed
    await waitFor(() => expect(account0bidPage.getByTestId('TokenCounter',{  })).toHaveTextContent('20'))

    //Bid disappeared from accepter list
    expect(account0bidPage.queryByTestId(`BidReceived:${bidId}`)).toBeNull()
    account0bidPage.unmount()
    //resource creator gets a transaction history entry
    const transactionId = await checkLastTokenTransactionOnAccount(accounts[0].data.id, 20, 12)

    const account0ContribPage = render(<ContribPage />)
    await waitFor(() => expect(account0ContribPage.getByTestId(`Transaction:${transactionId}`)).toBeInTheDocument())
    account0ContribPage.unmount()

    localStorage.setItem('token', accounts[1].data.token)
    const account1bidPage = render(<BidsPage />)
    //Bid disappeared from proposer list
    expect(account1bidPage.queryByTestId(`BidSent:${bidId}`)).toBeNull()
    //Proposer gets a notification
    account1bidPage.unmount()
    
    const notifId = await checkLastNotificationOnAccount(accounts[1].data.id, parsed => parsed.info === 'BID_ACCEPTED' && parsed.resourceId === resourceId &&
        parsed.resourceTitle === resourceTitle && parsed.acceptedBy === accounts[0].info.name)
    const account1NotifsPage = render(<NotifsPage />)
    await waitFor(() => expect(account1NotifsPage.getByTestId(`Notification:${notifId}`)).toBeInTheDocument())

    //Bid record got an accepted date
    await checkBidWasAccepted(bidId)
}, 10000)

test('refuse a bid', async () => {
    const event = userEvent.setup()
    //create bid on resource from account 2
    const viewResourcePage = await createBidUsingUi(accounts[1].data.token, event)
    viewResourcePage.unmount()
    const bidId = await check1ActiveBidOnResource(resourceId)

    localStorage.setItem('token', accounts[0].data.token)
    const account0bidPage = render(<BidsPage />)

    await waitForAndClick(`BidReceived:${bidId}:RefuseButton`, event, account0bidPage)
    
    //Token amount of refuser not changed
    await waitFor(() => expect(account0bidPage.getByTestId('TokenCounter')).toHaveTextContent('0'))

    //Bid disappeared from refuser list
    await waitFor(() => expect(account0bidPage.queryByTestId(`BidReceived:${bidId}`)).not.toBeInTheDocument())
    account0bidPage.unmount()


    localStorage.setItem('token', accounts[1].data.token)
    //bid creator gets a transaction history entry
    const transactionId = await checkLastTokenTransactionOnAccount(accounts[1].data.id, 20, 11)

    const account1ContribPage = render(<ContribPage />)
    await waitFor(() => expect(account1ContribPage.getByTestId(`Transaction:${transactionId}`)).toBeInTheDocument())

    //Token amount of bid creator changed
    await waitFor(() => expect(account1ContribPage.getByTestId('TokenCounter')).toHaveTextContent('30'))

    account1ContribPage.unmount()

    const account1bidPage = render(<BidsPage />)
    //Bid disappeared from proposer list
    expect(account1bidPage.queryByTestId(`BidSent:${bidId}`)).toBeNull()
    account1bidPage.unmount()
    
    //Proposer gets a notification
    const notifId = await checkLastNotificationOnAccount(accounts[1].data.id, parsed => parsed.info === 'BID_REFUSED' && parsed.resourceId === resourceId &&
        parsed.resourceTitle === resourceTitle && parsed.refusedBy === accounts[0].info.name)
    const account1NotifsPage = render(<NotifsPage />)
    await waitFor(() => expect(account1NotifsPage.getByTestId(`Notification:${notifId}`)).toBeInTheDocument())

    //Bid record got an accepted date
    await checkBidWasRefused(bidId)
}, 10000)

test('create, then delete a bid', async () => {
    const event = userEvent.setup()
    //create bid on resource from account 2
    const viewResourcePage = await createBidUsingUi(accounts[1].data.token, event)
    const bidId = await check1ActiveBidOnResource(resourceId)
    viewResourcePage.unmount()

    const account1Bidpage = render(<BidsPage />)
    await waitFor(() => expect(account1Bidpage.getByTestId(`BidSent:${bidId}`)).toBeInTheDocument())


    await waitForAndClick(`BidSent:${bidId}:DeleteButton`, event, account1Bidpage)

    //Bid deleted from bid creator list
    await waitFor(() => expect(account1Bidpage.queryByTestId(`BidSent:${bidId}`)).not.toBeInTheDocument())

    //Tokens from deleted bid were returned to the bid creator
    await waitFor(() => expect(account1Bidpage.getByTestId('TokenCounter')).toHaveTextContent('30'))

    //Bid creator has a token transaction history item
    const transactionId = await checkLastTokenTransactionOnAccount(accounts[1].data.id, 20, 11)

    const account1ContribPage = render(<ContribPage />)
    await waitFor(() => expect(account1ContribPage.getByTestId(`Transaction:${transactionId}`)).toBeInTheDocument())


    //resource creator got a notification
    const notifId = await checkLastNotificationOnAccount(accounts[0].data.id, parsed => parsed.info === 'BID_CANCELLED' && parsed.resourceId === resourceId &&
        parsed.resourceTitle === resourceTitle && parsed.cancelledBy === accounts[1].info.name)

    localStorage.setItem('token', accounts[0].data.token)
    const account0NotifsPage = render(<NotifsPage />)
    await waitFor(() => expect(account0NotifsPage.getByTestId(`Notification:${notifId}`)).toBeInTheDocument())

    //Bid is removed from resource creator bid list
    const account0bidPage = render(<BidsPage />)
    expect(account0bidPage.queryByTestId(`BidReceived:${bidId}`)).toBeNull()

    //Bid record got an deletion date
    await checkBidWasDeleted(bidId)
}, 10000)

test('create a bid, let it expire', async () => {
    const event = userEvent.setup()
    //create bid on resource from account 2
    const viewResourcePage = await createBidUsingUi(accounts[1].data.token, event)
    const bidId = await check1ActiveBidOnResource(resourceId)
    viewResourcePage.unmount()

    // Artificially make bid expired
    await executeQuery(`UPDATE sb.bids SET created=($1), valid_until=($2) WHERE id=($3)`, [dayjs().add(-1, 'hour'), dayjs().add(-30, 'minutes'), bidId])

    //Force scanning for expired bids
    await executeQuery(`SELECT sb.handle_resources_and_bids_expiration()`)

    //Bid should be removed from list of bid creator
    const account1BidsPage = render(<BidsPage />)
    await waitFor(() => expect(account1BidsPage.queryByTestId(`BidsSentList:Loading`)).not.toBeInTheDocument())
    expect(account1BidsPage.queryByTestId(`BidSent:${bidId}`)).toBeNull()

    //Bid creator should have got back the tokens from the bid
    await waitFor(() => expect(account1BidsPage.getByTestId('TokenCounter')).toHaveTextContent('30'))

    //Bid creator should have a notif
    const notifId = await checkLastNotificationOnAccount(accounts[1].data.id, 
        parsed => parsed.info === 'BID_EXPIRED' && parsed.resourceId === resourceId && 
                parsed.resourceTitle === resourceTitle && parsed.resourceAuthor === accounts[0].info.name)
    const account1NotifPage = render(<NotifsPage />)

    await waitFor(() => expect(account1NotifPage.getByTestId(`Notification:${notifId}`)).toBeInTheDocument())

    //Bid record got an deletion date
    await checkBidWasDeleted(bidId)
}, 10000)

test('create a bid on a resource, let the resource expire', async () => {
    const event = userEvent.setup()
    //create bid on resource from account 2
    const viewResourcePage = await createBidUsingUi(accounts[1].data.token, event)
    const bidId = await check1ActiveBidOnResource(resourceId)
    viewResourcePage.unmount()

    // Artificially make bid expired
    await executeQuery(`UPDATE sb.resources SET created=($1), expiration=($2) WHERE id=($3)`, [dayjs().add(-1, 'hour'), dayjs().add(-30, 'minutes'), resourceId])

    //Force scanning for expired bids or resources
    await executeQuery(`SELECT sb.handle_resources_and_bids_expiration()`)

    //Bid should be removed from list of bid creator
    const account1BidsPage = render(<BidsPage />)
    await waitFor(() => expect(account1BidsPage.queryByTestId(`BidsSentList:Loading`)).not.toBeInTheDocument())
    expect(account1BidsPage.queryByTestId(`BidSent:${bidId}`)).toBeNull()

    //Bid creator should have got back the tokens from the bid
    await waitFor(() => expect(account1BidsPage.getByTestId('TokenCounter')).toHaveTextContent('30'))

    //Bid creator should have a notif
    const notifId = await checkLastNotificationOnAccount(accounts[1].data.id, 
        parsed => parsed.info === 'BID_AUTO_DELETED_AFTER_RESOURCE_EXPIRED' && parsed.resourceId === resourceId && 
                parsed.resourceTitle === resourceTitle && parsed.resourceAuthor === accounts[0].info.name)
    const account1NotifPage = render(<NotifsPage />)

    await waitFor(() => expect(account1NotifPage.getByTestId(`Notification:${notifId}`)).toBeInTheDocument())

    //Bid record got an deletion date
    await checkBidWasDeleted(bidId)
}, 10000)

afterEach(async () => {
    return cleanupTestAccounts(accounts)
})