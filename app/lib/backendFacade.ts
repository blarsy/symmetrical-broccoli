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
        }`,
        CREATE_RESOURCE: gql`mutation CreateResource($categoryCodes: [Int], $canBeDelivered: Boolean, $canBeExchanged: Boolean, $canBeGifted: Boolean, $canBeTakenAway: Boolean, $title: String, $isService: Boolean, $isProduct: Boolean, $imagesPublicIds: [String], $expiration: Datetime, $description: String, $specificLocation: NewLocationInput = {}) {
            createResource(
              input: {canBeDelivered: $canBeDelivered, canBeExchanged: $canBeExchanged, canBeGifted: $canBeGifted, canBeTakenAway: $canBeTakenAway, categoryCodes: $categoryCodes, description: $description, expiration: $expiration, imagesPublicIds: $imagesPublicIds, isProduct: $isProduct, isService: $isService, title: $title, specificLocation: $specificLocation}
            ) {
              integer
            }
        }`
    },
    subscriptions: {}
}