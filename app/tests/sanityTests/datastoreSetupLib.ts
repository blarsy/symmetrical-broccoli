import { getApolloClient } from "@/lib/apolloClient"
import { GraphQlLib } from "@/lib/backendFacade"
import { ApolloClient, gql, InMemoryCache } from "@apollo/client"
import dayjs from "dayjs"
import config from "./config"
import { executeQuery } from "./lib"

export const getToken = async (email: string, password: string) => {
    const client = getApolloClient('')
    const res = await client.mutate({ mutation: GraphQlLib.mutations.AUTHENTICATE, variables: { email, password } } )
    return res.data.authenticate.jwtToken as string
}

const confirmAccount = async (email: string) => {
    const res = await executeQuery(`select activation_code 
        from sb.email_activations ea
        where email = lower($1)`, [email])

    return simulateActivation(res.rows[0].activation_code)
}

export const createAndLogIn = async (email: string, name: string, password: string, confirm: boolean = false, contributor: boolean = false): Promise<string> => {
    let client = getApolloClient('')
    try {
        const res = await client.mutate({ mutation: GraphQlLib.mutations.REGISTER_ACCOUNT, variables: { email, name, password, language: 'fr' } } )
        if(confirm) await confirmAccount(email)
        client = getApolloClient(res.data.registerAccount.jwtToken)
        if(contributor) await client.mutate({ mutation: GraphQlLib.mutations.SWITCH_TO_CONTRIBUTION_MODE })
        return (res.data.registerAccount.jwtToken as string)
    } catch (e) {
        console.debug('Error while trying to login', e)
        throw e
    }
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
        throw new Error(``)
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
    canBeExchanged: boolean, canBeGifted: boolean, expiration: Date, categoryCodes: number[]): Promise<number> => {
    const loggedInClient = getApolloClient(jwtToken)
    const res = await loggedInClient.mutate({ mutation: GraphQlLib.mutations.CREATE_RESOURCE, variables: {
        canBeDelivered, canBeExchanged, canBeGifted, canBeTakenAway, categoryCodes, description, 
        expiration, isProduct, isService, title
    } })
    return res.data.createResource.integer
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
    await new ApolloClient({ uri: config.graphQlUrl, cache: new InMemoryCache() })
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

export const getTestNum = () => dayjs(new Date()).format('YYYYMMDD') + makeid(5)

interface SearchableResources {
    accounts: {
        name: string;
        token: string;
    }[];
    resourceIds: [number, number, number, number, number, number, number];
}

export const setupSearchableResources = async (testNum: string): Promise<SearchableResources> => {
    const password = 'Password1!'
    const name1 = `me${testNum}-1`, name2 = `me${testNum}-2`
    const dateInFuture = new Date(new Date().valueOf() + 1000 * 60 * 60 * 24 * 4)

    const tokens = await Promise.all([ 
        createAndLogIn(`${name1}@me.com`, name1, password, true),
        createAndLogIn(`${name2}@me.com`, name2, password, true)
    ])

    const accounts = [
        {name: name1, token: tokens[0]},
        {name: name2, token: tokens[1]},
    ]

    const resourceIds = await Promise.all([
        createResource(tokens[0], `${name1}-1`, 'desc', true, false, true, false, true, false, new Date(), [10]),
        createResource(tokens[0], `${name1}-2`, 'desc', true, false, true, false, true, false, dateInFuture, [10]),
        createResource(tokens[0], `${name1}-3`, 'desc', false, true, false, true, false, false, dateInFuture, [2, 10]),
        createResource(tokens[1], `${name2}-1`, 'desc', false, true, false, true, false, false, new Date(), [2]),
        createResource(tokens[1], `${name2}-2`, 'desc', false, true, false, true, false, false, dateInFuture, [2, 10]),
        createResource(tokens[1], `${name2}-3`, 'desc', true, true, true, true, true, true, dateInFuture, [10]),
        createResource(tokens[1], `${name1}-suspended`, 'desc', true, false, true, false, true, false, dateInFuture, [10]),
    ])
    await setResourceData(resourceIds[6], { suspended: new Date() })

    return { accounts, resourceIds }
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