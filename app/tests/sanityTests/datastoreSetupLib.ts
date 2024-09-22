import { getApolloClient } from "@/lib/apolloClient"
import { GraphQlLib } from "@/lib/backendFacade"


export const deleteAccount = async (email: string, password: string) => {
    const client = getApolloClient('')
    try {
        const res = await client.mutate({ mutation: GraphQlLib.mutations.AUTHENTICATE, variables: { email, password } } )
        const jwtToken = res.data.authenticate.jwtToken
        
        if(jwtToken) {
            const loggedInClient = getApolloClient(jwtToken)
            return await loggedInClient.mutate({ mutation: GraphQlLib.mutations.DELETE_ACCOUNT })
        }
    } catch(e) {
        console.debug('Error while trying to login, then delete account', e)
    }
}

