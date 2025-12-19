import { getApolloClient } from "@/lib/apolloClient"
import { ApolloClient, gql, InMemoryCache } from "@apollo/client"
import dayjs from "dayjs"
import config from "./config"
import { Client, QueryResult } from "pg"
import { AUTHENTICATE, REGISTER_ACCOUNT } from "@/lib/useAccountFunctions"
import { DELETE_ACCOUNT } from "@/components/user/Profile"
import { CREATE_RESOURCE } from "@/components/resources/EditResource"
import { DELETE_RESOURCE } from "@/components/resources/Resources"
import { waitFor } from "@testing-library/dom"
import { UserEvent } from "@testing-library/user-event"
import { RenderResult } from "@testing-library/react"
import { UPDATE_ACCOUNT_PUBLIC_INFO } from "@/lib/useProfile"
import { Location } from '@/lib/schema'
import { SUGGEST_RESOURCES } from "@/components/search/Search"

const VERSION = 'v0_10'

export const CREATE_CAMPAIGN = gql`mutation CreateCampaign($name: String, $beginning: Datetime, $ending: Datetime, $description: String, $defaultResourceCategories: [Int], $airdrop: Datetime, $resourceRewardsMultiplier: Int, $airdropAmount: Int) {
  createCampaign(
    input: {airdrop: $airdrop, defaultResourceCategories: $defaultResourceCategories, description: $description, ending: $ending, beginning: $beginning, name: $name, resourceRewardsMultiplier: $resourceRewardsMultiplier, airdropAmount: $airdropAmount}
  ) {
    integer
  }
}`

export const getToken = async (email: string, password: string) => {
    const client = getApolloClient(VERSION, '')
    const res = await client.mutate({ mutation: AUTHENTICATE, variables: { email, password } } )
    return res.data.authenticate.jwtToken as string
}

const getOpenConnection = async () => {
    const pgClient = new Client({
        user: config.user,
        host: config.host,
        database: config.database,
        password: config.password,
        port: config.port
    })

    await pgClient.connect()

    return pgClient
}

export const executeQuery = async (query: string, parameters?: any[]): Promise<QueryResult<any>> => {
    const client = await getOpenConnection()
    
    try {
        return await client.query(query , parameters)
    } catch(e) {
        console.error(`Error while executing ${query} with params ${parameters}`, e)
        throw(e)
    } finally {
        client.end()
    }
}

export const waitForAndClick = async (testID: string, event: UserEvent, s: RenderResult) => {
    await waitFor(() => expect(s.getByTestId(testID)).toBeInTheDocument(), { timeout: 4000 })
    await event.click(s.getByTestId(testID))
}

const confirmAccount = async (email: string) => {
    const res = await executeQuery(`select activation_code 
        from sb.email_activations ea
        where email = lower($1)`, [email])

    return simulateActivation(res.rows[0].activation_code)
}

export interface NewAccountData {
    token: string,
    id: number
}

export const createAndLogIn = async (email: string, name: string, password: string, confirm: boolean = false): Promise<NewAccountData> => {
    let client = getApolloClient(VERSION, '')
    try {
        const res = await client.mutate({ mutation: REGISTER_ACCOUNT, variables: { email, name, password, language: 'fr' } } )
        if(confirm) await confirmAccount(email)
        client = getApolloClient(VERSION, res.data.registerAccount.jwtToken)
        const idRow = await executeQuery('SELECT id from sb.accounts WHERE lower(email) = $1', [email])
        return { token: (res.data.registerAccount.jwtToken as string), id: idRow.rows[0].id }
    } catch (e) {
        console.debug('Error while trying to login', e)
        throw e
    }
}

export const authenticate = async (email: string, password: string) => {
    const client = getApolloClient(VERSION, '')
    try {
        const res = await client.mutate({ mutation: AUTHENTICATE, variables: { email, password } } )
        //console.log('jwt', res.data.jwtToken, 'res.data', res.data)
        return res.data.authenticate.jwtToken
    } catch (e) {
        console.debug('Error while trying to authenticate', e)
        throw e
    }  
}

export const deleteAccount = async (email: string, password: string) => {
    try {
        const jwtToken = await getToken(email, password)
        
        if(jwtToken) {
            return await deleteAccountByToken(jwtToken)
        }
        throw new Error(``)
    } catch(e) {
        console.debug('Error while trying to delete account', e)
    }
}

const deleteAccountByToken = async (token: string) => {
    const loggedInClient = getApolloClient(VERSION, token)
    return await loggedInClient.mutate({ mutation: DELETE_ACCOUNT })
}

export const setAccountLocation = async (account: TestAccount, location: Location) => {
    const loggedInClient = getApolloClient(VERSION, account.data.token)
    loggedInClient.mutate({ mutation: UPDATE_ACCOUNT_PUBLIC_INFO, variables: { links: [], location } })
}

export const makeSearch = async (account: TestAccount, term: string) => {
    const loggedInClient = getApolloClient(VERSION, account.data.token)
    return loggedInClient.mutate({ mutation: SUGGEST_RESOURCES, variables: { 
        canBeDelivered: false, canBeExchanged: false, canBeGifted: false, 
        canBeTakenAway: false, categoryCodes: [], distanceToReferenceLocation: 50,
        excludeUnlocated: false, isProduct:false, 
        isService: false, referenceLocationLatitude: 0,
        referenceLocationLongitude: 0, searchTerm: term
    } })
}

export const createResource = async (jwtToken: string, title: string, description: string,
    isProduct: boolean, isService: boolean, canBeDelivered: boolean, canBeTakenAway: boolean, 
    canBeExchanged: boolean, canBeGifted: boolean, expiration: Date | undefined, 
    categoryCodes: number[], campaignToJoin?: number, specificLocation?: Location): Promise<number> => {
    const loggedInClient = getApolloClient(VERSION, jwtToken)
    const res = await loggedInClient.mutate({ mutation: CREATE_RESOURCE, variables: {
        canBeDelivered, canBeExchanged, canBeGifted, canBeTakenAway, categoryCodes, description, 
        expiration, isProduct, isService, title, campaignToJoin, specificLocation
    } })
    return res.data.createResource.integer
}

interface ResourceRawData {
    title: string, description?: string, expiration: Date, accountId: number, created?: Date, 
    isService?: boolean, isProduct?: boolean, canBeDelivered?: boolean, canBeTakenAway?: boolean, 
    canBeExchanged?: boolean, canBeGifted?: boolean, deleted?: Date
}

export const createResourceLowLevel = async (res: ResourceRawData): Promise<number> => {
    const result = await executeQuery(`INSERT INTO sb.resources
        (title, description, expiration, account_id, created, is_service, is_product, can_be_delivered, can_be_taken_away, can_be_exchanged, can_be_gifted, deleted)
	    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) returning id`, [
            res.title, res.description || 'description', res.expiration, res.accountId, res.created || new Date(),
            res.isService || false, res.isProduct || false, res.canBeDelivered || false, res.canBeTakenAway || false, 
            res.canBeExchanged || false, res.canBeGifted || false, res.deleted || null
        ])
    return result.rows[0].id
}

export const createResourceLowLevelWithAnImage = async (res: ResourceRawData, publicImageId: string): Promise<number> => {
    const resId = await createResourceLowLevel(res)
    let imgId: number
    const imgExistsRes = await executeQuery(`SELECT id FROM sb.images WHERE public_id = ($1)`, [publicImageId])
    if(imgExistsRes.rowCount && imgExistsRes.rowCount > 0) {
        imgId = imgExistsRes.rows[0].id
    } else {
        const imgRes = await executeQuery(`INSERT INTO sb.images(public_id) VALUES ($1) RETURNING id`, [publicImageId])
        imgId = imgRes.rows[0].id
    }
    await executeQuery(`INSERT INTO sb.resources_images(resource_id, image_id) VALUES ($1, $2)`, [resId, imgId])
    return resId
}

export const deleteResource = async (jwtToken: string, resourceId: number) => {
    const loggedInClient = getApolloClient(VERSION, jwtToken)
    return await loggedInClient.mutate({ mutation: DELETE_RESOURCE, variables: { resourceId } })
}

const APPLY_ACCOUNT_RESOURCES_REWARDS = gql`mutation ApplyAccountResourcesRewards($accountId: Int) {
    applyAccountResourcesRewards(input: {accountId: $accountId}) {
      clientMutationId
    }
  }`

export const applyResourceRewards = async (jwtToken: string, accountId: number) => {
    const loggedInClient = getApolloClient(VERSION, jwtToken)
    return loggedInClient.mutate({ mutation: APPLY_ACCOUNT_RESOURCES_REWARDS, variables: { accountId } })
}

export const setResourceData = async (id: number, dates:{ deleted?: Date, created?: Date}) => {
    const sets = Object.entries(dates).map(([name, date], idx) => `${name} = $${idx + 2}`)
    const vals = Object.entries(dates).map(([name, date]) => date)
    await executeQuery(`update sb.resources r
        set ${sets.join(',')}
        where r.id = $1`, [ id, ...vals])
}

const ACTIVATE = gql`mutation ActivateAccount($activationCode: String) {
    activateAccount(input: {activationCode: $activationCode}) {
        string
    }
}`

export const simulateActivation = async (activationCode: string) => {
    return getApolloClient(VERSION).mutate({ mutation: ACTIVATE, variables: { activationCode } })   
}

function makeid(length: number) {
    let result = '';
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}

export const getTestNum = () => dayjs(new Date()).format('YYYYMMDD_HHmmss_SSS') + makeid(5)

export interface TestAccountInfo {
    email: string
    name: string
}

export interface TestAccount {
    info: TestAccountInfo,
    data: NewAccountData
}

const defaultPassword = 'Password1!'
export const makeTestAccountInfo = (amount: number): TestAccountInfo[] => {
    const result: TestAccountInfo[] = []
    const testNum = getTestNum()
    for(let i = 0; i<amount; i++) {
        result.push({ email: `t${testNum}-${i}@test.com`, name: `t${testNum}-${i}` })
    }
    return result
}

export interface TestAccountInput {
    confirm?: boolean
    contributor?: boolean
    initialTokenAmount?: number
}

export const makeTestAccounts = (inputs: TestAccountInput[]): Promise<TestAccount[]> => {
    return Promise.all(makeTestAccountInfo(inputs.length).map(async (accountInfo, idx) => {
        const accountData = await createAndLogIn(accountInfo.email, accountInfo.name, defaultPassword, inputs[idx].confirm)
        if(inputs[idx].initialTokenAmount) {
            await executeQuery('update sb.accounts set amount_of_tokens = $1 where id = $2', [inputs[idx].initialTokenAmount, accountData.id])
        }
        return {
            info: accountInfo,
            data: accountData
        }
    }))
}

export const cleanupTestAccounts = (accounts: TestAccount[]) => {
    return Promise.all(accounts.map(account => deleteAccount(account.info.email, defaultPassword)))
}

interface SearchableResources {
    accounts: {
        name: string;
        token: string;
    }[];
    resourceIds: [number, number, number, number, number, number];
}

export const setupSearchableResources = async (testNum: string): Promise<SearchableResources> => {
    const password = 'Password1!'
    const name1 = `me${testNum}-1`, name2 = `me${testNum}-2`
    const dateInFuture = new Date(new Date().valueOf() + 1000 * 60 * 60 * 24 * 4)

    const accounts = await Promise.all([ 
        createAndLogIn(`${name1}@me.com`, name1, password, true),
        createAndLogIn(`${name2}@me.com`, name2, password, true)
    ])

    const accountNames = [
        {name: name1, data: accounts[0]},
        {name: name2, data: accounts[1]},
    ]

    const resourceIds = await Promise.all([
        createResource(accounts[0].token, `${name1}-1`, 'desc', true, false, true, false, true, false, new Date(), [10]),
        createResource(accounts[0].token, `${name1}-2`, 'desc', true, false, true, false, true, false, dateInFuture, [10]),
        createResource(accounts[0].token, `${name1}-3`, 'desc', false, true, false, true, false, false, dateInFuture, [2, 10]),
        createResource(accounts[1].token, `${name2}-1`, 'desc', false, true, false, true, false, false, new Date(), [2]),
        createResource(accounts[1].token, `${name2}-2`, 'desc', false, true, false, true, false, false, dateInFuture, [2, 10]),
        createResource(accounts[1].token, `${name2}-3`, 'desc', true, true, true, true, true, true, dateInFuture, [10]),
    ])

    return { accounts: accountNames.map((acc) => ({ name: acc.name, token: acc.data.token })), resourceIds }
}

export const cleanupSearchableResources = async (data: SearchableResources) => {
    return Promise.all(data.accounts.map(account => {
        return deleteAccountByToken(account.token)
    }))
}

export const setAccountTokens = async (email: string, numberOfTokens: number) => {
    await executeQuery(`update sb.accounts
        set amount_of_tokens = $1
        where email = lower($2)`, [numberOfTokens, email])
}

export const createCampaign = async (name: string, description: string,
    airdrop: Date, airdropAmount: number, resourceRewardsMultiplier: number, beginning: Date, 
    ending: Date): Promise<number> => {
    const res = await executeQuery(`INSERT INTO sb.campaigns(
        name, description, airdrop, airdrop_amount, resource_rewards_multiplier, beginning, ending)
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id;`, [ name, description, airdrop, airdropAmount, resourceRewardsMultiplier, beginning, ending])
    return res.rows[0].id;
}

export const checkLastNotificationOnAccount = async(accountId: number, checkData: (parsed: any) => boolean) => {
    const res = await executeQuery(`SELECT id, data FROM sb.notifications
        WHERE account_id = ($1) AND read IS NULL
        ORDER BY id desc 
        LIMIT 1`, [accountId])

    expect(checkData(res.rows[0].data)).toBeTruthy()

    return res.rows[0].id
}

export const checkAccountTokens = async (email: string, expectedAmountOfTokens: number) => {
    const result = await executeQuery(`select amount_of_tokens from sb.accounts
        where email = lower($1)`, [email])
    
    expect(result.rows[0].amount_of_tokens).toBe(expectedAmountOfTokens)
}

export const removeActiveCampaign = async () => {
    await executeQuery(`
        delete from sb.campaigns_resources where campaign_id = (select id from sb.get_active_campaign());
        delete from sb.campaigns where id = (select id from sb.get_active_campaign());
    `)
}