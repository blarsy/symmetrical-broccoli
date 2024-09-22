import { FetchResult, gql, MutationResult, useMutation } from "@apollo/client"

export const GraphQlLib = {
    queryies: {},
    mutations: {
        REGISTER_ACCOUNT: gql`mutation RegisterAccount($email: String, $name: String, $password: String, $language: String) {
            registerAccount(
              input: {email: $email, name: $name, password: $password, language: $language}
            ) {
              jwtToken
            }
        }`,
        DELETE_ACCOUNT: gql`mutation DeleteAccount {
            deleteAccount(input: {}) {
                integer
            }
        }`,
        AUTHENTICATE: gql`mutation Authenticate($email: String, $password: String) {
            authenticate(input: {email: $email, password: $password}) {
                jwtToken
            }
        }`
    },
    subscriptions: {}
}

export const useRegisterAccount = () => {
    const [registerAccount, result] = useMutation(GraphQlLib.mutations.REGISTER_ACCOUNT)

    return [
        (name: string, email: string, password: string, language: string) => registerAccount({ variables: 
            { email, name,  password, language } }),
        result
    ] as [(name: string, email: string, password: string, language: string) => Promise<FetchResult<any>>, MutationResult<any>]
}

export const useDeleteAccount = () => {
    const [deleteAccount, result] = useMutation(GraphQlLib.mutations.DELETE_ACCOUNT)

    return [
        () => deleteAccount({ variables: {  } }),
        result
    ] as [() => Promise<FetchResult<any>>, MutationResult<any>]
}

export const useAuthenticate = () => {
    const [authenticate, result] = useMutation(GraphQlLib.mutations.AUTHENTICATE)

    return [
        (email: string, password: string) => authenticate({ variables: 
            { email,  password } }),
        result
    ] as [(email: string, password: string) => Promise<FetchResult<any>>, MutationResult<any>]

}