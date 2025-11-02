import { getApolloClient } from "@/lib/apolloClient"
import { GraphQlLib } from "@/lib/backendFacade"
import { ApolloClient, gql, HttpLink, InMemoryCache } from "@apollo/client"
import dayjs from "dayjs"
import config from "./config"
import { executeQuery } from "./lib"
import { UPDATE_ACCOUNT_PUBLIC_INFO } from "@/components/form/EditProfile"
import { Link, Location } from "@/lib/schema"
import { SUGGEST_RESOURCES } from "@/components/SearchFilterContextProvider"

export const getToken = async (email: string, password: string) => {
    const client = getApolloClient('')
    const res = await client.mutate({ mutation: GraphQlLib.mutations.AUTHENTICATE, variables: { email, password } } )
    return res.data.authenticate.jwtToken as string
}

export const fromToday = (days: number) =>
    new Date(new Date().valueOf() + 1000 * 60 * 60 * 24 * days)

export const createCampaign = async (name: string, description: string,
    airdrop: Date, airdropAmount: number, resourceRewardsMultiplier: number, beginning: Date, 
    ending: Date): Promise<number> => {
    await executeQuery(`INSERT INTO sb.campaigns(
        name, description, airdrop, airdrop_amount, resource_rewards_multiplier, beginning, ending)
        VALUES ($1, $2, $3, $4, $5, $6, $7);`, [ name, description, airdrop, airdropAmount, resourceRewardsMultiplier, beginning, ending])
    const res = await executeQuery('select id from sb.get_active_campaign();')
    return res.rows[0].id;
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

export const createAndLogIn = async (email: string, name: string, password: string, confirm: boolean = false, contributor: boolean = false, unlimited: boolean = false): Promise<NewAccountData> => {
    let client = getApolloClient('')
    try {
        const res = await client.mutate({ mutation: GraphQlLib.mutations.REGISTER_ACCOUNT, variables: { email, name, password, language: 'fr' } } )
        if(confirm) await confirmAccount(email)
        client = getApolloClient(res.data.registerAccount.jwtToken)
        if(contributor) await client.mutate({ mutation: GraphQlLib.mutations.SWITCH_TO_CONTRIBUTION_MODE })
        if(unlimited) await executeQuery('UPDATE sb.accounts SET unlimited_until = $1 WHERE email = $2', [new Date(new Date().valueOf() + 1000 * 50 * 50 * 24 * 365), email])
        const idRow = await executeQuery('SELECT id from sb.accounts WHERE lower(email) = $1', [email])
        return { token: (res.data.registerAccount.jwtToken as string), id: idRow.rows[0].id }
    } catch (e) {
        console.debug('Error while trying to login', e)
        throw e
    }
}

export const setAccountAddress = async (token: string, location: Location, links: Link[] = []) => {
    const client = getApolloClient(token)
    const res = await client.mutate({ mutation: UPDATE_ACCOUNT_PUBLIC_INFO, variables: {
        location, 
        links: links.map(link => ({ label: link.label, url: link.url, linkTypeId: link.type })) 
    } })
    return res.data.updateAccountPublicInfo.integer === 1
}

export const searchResourcesOnTerm = async (token: string, term: string) => {
    const client = getApolloClient(token)
    await client.mutate({ mutation: SUGGEST_RESOURCES, variables: {
        categoryCodes: [1],
        searchTerm: term,
        isProduct: false,
        isService: false,
        canBeTakenAway: false,
        canBeDelivered: false,
        canBeExchanged: false,
        canBeGifted: false,
        excludeUnlocated: false,
        referenceLocationLatitude: 0,
        referenceLocationLongitude: 0,
        distanceToReferenceLocation: null,
        inActiveCampaign: false
    }})
}

export const authenticate = async (email: string, password: string) => {
    const client = getApolloClient('')
    try {
        const res = await client.mutate({ mutation: GraphQlLib.mutations.AUTHENTICATE, variables: { email, password } } )
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
        throw new Error(`No JWT token found for account '${email}', cannot delete`)
    } catch(e) {
        console.debug('Error while trying to delete account', e)
    }
}

const deleteAccountByToken = async (token: string) => {
    const loggedInClient = getApolloClient(token)
    return await loggedInClient.mutate({ mutation: GraphQlLib.mutations.DELETE_ACCOUNT })
}

export const createResource = async (jwtToken: string, title: string, description: string,
    isProduct: boolean, isService: boolean, canBeDelivered: boolean, canBeTakenAway: boolean, 
    canBeExchanged: boolean, canBeGifted: boolean, expiration: Date | null, categoryCodes: number[], 
    location: Location | null = null, campaignToJoin: number | null = null): Promise<number> => {
    const loggedInClient = getApolloClient(jwtToken)
    const res = await loggedInClient.mutate({ mutation: GraphQlLib.mutations.CREATE_RESOURCE, variables: {
        canBeDelivered, canBeExchanged, canBeGifted, canBeTakenAway, categoryCodes, description, 
        expiration, isProduct, isService, title, price: null, campaignToJoin, specificLocation: location
    } })
    return res.data.createResource.integer
}

interface ResourceRawData {
    title: string, description?: string, expiration: Date, accountId: number, created?: Date, 
    isService?: boolean, isProduct?: boolean, canBeDelivered?: boolean, canBeTakenAway?: boolean, 
    canBeExchanged?: boolean, canBeGifted?: boolean, deleted?: Date, suspended?: Date, paidUntil?: Date,
    campaignIdToJoin?: number
}

export const createResourceLowLevel = async (res: ResourceRawData): Promise<number> => {
    const result = await executeQuery(`INSERT INTO sb.resources
        (title, description, expiration, account_id, created, is_service, is_product, can_be_delivered, can_be_taken_away, can_be_exchanged, can_be_gifted, deleted, suspended, paid_until)
	    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) returning id`, [
            res.title, res.description || 'description', res.expiration, res.accountId, res.created || new Date(),
            res.isService || false, res.isProduct || false, res.canBeDelivered || false, res.canBeTakenAway || false, 
            res.canBeExchanged || false, res.canBeGifted || false, res.deleted || null, res.suspended || null, 
            res.paidUntil || null
        ])
    
    if(res.campaignIdToJoin) {
        await executeQuery('INSERT INTO sb.campaigns_resources (campaign_id, resource_id) VALUES ($1, $2)', [res.campaignIdToJoin, result.rows[0].id])
    }

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
    const loggedInClient = getApolloClient(jwtToken)
    return await loggedInClient.mutate({ mutation: GraphQlLib.mutations.DELETE_RESOURCE, variables: { resourceId } })
}

const APPLY_ACCOUNT_RESOURCES_REWARDS = gql`mutation ApplyAccountResourcesRewards($accountId: Int) {
    applyAccountResourcesRewards(input: {accountId: $accountId}) {
      clientMutationId
    }
  }`

export const applyResourceRewards = async (jwtToken: string, accountId: number) => {
    const loggedInClient = getApolloClient(jwtToken)
    return loggedInClient.mutate({ mutation: APPLY_ACCOUNT_RESOURCES_REWARDS, variables: { accountId } })
}

export const setResourceData = async (id: number, dates:{ suspended?: Date, deleted?: Date, paid_until?: Date, created?: Date}) => {
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
    await new ApolloClient({link: new HttpLink({ uri: config.graphQlUrl }), cache: new InMemoryCache()})
        .mutate({ mutation: ACTIVATE, variables: { activationCode } })
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
    unlimited?: boolean
}

export const makeTestAccounts = (inputs: TestAccountInput[]): Promise<TestAccount[]> => {
    return Promise.all(makeTestAccountInfo(inputs.length).map(async (accountInfo, idx) => {
        const accountData = await createAndLogIn(accountInfo.email, accountInfo.name, defaultPassword, inputs[idx].confirm, inputs[idx].contributor, inputs[idx].unlimited)
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
    resourceIds: [number, number, number, number, number, number, number];
}

export const searchableResourceTitles = [
    `Pots weck`,`Carte Pokemon 151`,`Siège de bureau porsche`,`Jante 5x112 Monaco`
]
export const searchableAccountNames = [`Artisan intéressant`, `Patissier à domicile`]

export const setupSearchableResources = async (testNum: string): Promise<SearchableResources> => {
    const password = 'Password1!'
    const dateInFuture = new Date(new Date().valueOf() + 1000 * 60 * 60 * 24 * 4)

    const accounts = await Promise.all([ 
        createAndLogIn(`me${testNum}-1@me.com`, searchableAccountNames[0], password, true, true),
        createAndLogIn(`me${testNum}-2@me.com`, searchableAccountNames[1], password, true, true)
    ])

    const accountNames = [
        {name: searchableAccountNames[0], data: accounts[0]},
        {name: searchableAccountNames[1], data: accounts[1]},
    ]

    const resourceIds = await Promise.all([
        createResource(accounts[0].token, `${searchableAccountNames[0]}-1`, 'desc', true, false, true, false, true, false, new Date(), [10]),
        createResource(accounts[0].token, searchableResourceTitles[0], 'desc', true, false, true, false, true, false, dateInFuture, [10]),
        createResource(accounts[0].token, searchableResourceTitles[1], 'desc', false, true, false, true, false, false, dateInFuture, [2, 10]),
        createResource(accounts[1].token, `${searchableAccountNames[1]}-1`, 'desc', false, true, false, true, false, false, new Date(), [2]),
        createResource(accounts[1].token, searchableResourceTitles[2], 'desc', false, true, false, true, false, false, dateInFuture, [2, 10]),
        createResource(accounts[1].token, searchableResourceTitles[3], 'desc', true, true, true, true, true, true, dateInFuture, [10]),
        createResource(accounts[1].token, `suspended res`, 'desc', true, false, true, false, true, false, dateInFuture, [10]),
    ])
    await setResourceData(resourceIds[6], { suspended: new Date() })

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

export const removeActiveCampaign = async () => {
    await executeQuery(`
        delete from sb.campaigns_resources where campaign_id = (select id from sb.get_active_campaign());
        delete from sb.campaigns where id = (select id from sb.get_active_campaign());
    `)
}