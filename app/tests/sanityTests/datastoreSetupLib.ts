import { getApolloClient } from "@/lib/apolloClient"
import { GraphQlLib } from "@/lib/backendFacade"
import { ApolloClient, gql, InMemoryCache } from "@apollo/client"
import dayjs from "dayjs"
import config from "./config"

export const getToken = async (email: string, password: string) => {
    const client = getApolloClient('')
    try {
        const res = await client.mutate({ mutation: GraphQlLib.mutations.AUTHENTICATE, variables: { email, password } } )
        return res.data.authenticate.jwtToken
    } catch (e) {
        console.debug('Error while trying to login', e)
    }
}

export const createAndLogIn = async (email: string, name: string, password: string) => {
    const client = getApolloClient('')
    try {
        const res = await client.mutate({ mutation: GraphQlLib.mutations.REGISTER_ACCOUNT, variables: { email, name, password, language: 'fr' } } )
        return res.data.registerAccount.jwtToken
    } catch (e) {
        console.debug('Error while trying to login', e)
    }
}

export const deleteAccount = async (email: string, password: string) => {
    try {
        const jwtToken = await getToken(email, password)
        
        if(jwtToken) {
            const loggedInClient = getApolloClient(jwtToken)
            return await loggedInClient.mutate({ mutation: GraphQlLib.mutations.DELETE_ACCOUNT })
        }
    } catch(e) {
        console.debug('Error while trying to login, then delete account', e)
    }
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

