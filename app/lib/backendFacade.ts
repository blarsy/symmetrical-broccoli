import { gql } from "@apollo/client"

export const GraphQlLib = {
    queries: {
      GET_ACCOUNT: gql`query Account($id: Int!) {
        accountById(id: $id) {
          email
          name
          id
          resourcesByAccountId(orderBy: CREATED_DESC) {
            nodes {
              id
              canBeGifted
              canBeExchanged
              title
              deleted
              expiration
              suspended
              paidUntil
              resourcesImagesByResourceId {
                nodes {
                  imageByImageId {
                    publicId
                  }
                }
              }
              resourcesResourceCategoriesByResourceId {
                nodes {
                  resourceCategoryCode
                }
              }
              accountByAccountId {
                id
              }
            }
          }
          imageByAvatarImageId {
            publicId
          }
          accountsLinksByAccountId {
            nodes {
              id
              url
              label
              linkTypeByLinkTypeId {
                id
              }
            }
          }
          locationByLocationId {
            address
            id
            longitude
            latitude
          }
        }
      }`
    },
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
        DELETE_RESOURCE: gql`mutation DeleteResource($resourceId: Int) {
          deleteResource(input: {resourceId: $resourceId}) {
            integer
          }
        }`,
        AUTHENTICATE: gql`mutation Authenticate($email: String, $password: String) {
            authenticate(input: {email: $email, password: $password}) {
                jwtToken
            }
        }`,
        CREATE_RESOURCE: gql`mutation CreateResource($categoryCodes: [Int], $canBeDelivered: Boolean, $canBeExchanged: Boolean, $canBeGifted: Boolean, $canBeTakenAway: Boolean, $title: String, $isService: Boolean, $isProduct: Boolean, $imagesPublicIds: [String], $expiration: Datetime, $description: String, $specificLocation: NewLocationInput = {}, $subjectiveValue: Int) {
          createResource(
            input: {canBeDelivered: $canBeDelivered, canBeExchanged: $canBeExchanged, canBeGifted: $canBeGifted, canBeTakenAway: $canBeTakenAway, categoryCodes: $categoryCodes, description: $description, expiration: $expiration, imagesPublicIds: $imagesPublicIds, isProduct: $isProduct, isService: $isService, title: $title, specificLocation: $specificLocation, subjectiveValue: $subjectiveValue}
          ) {
            integer
          }
        }`,
        SWITCH_TO_CONTRIBUTION_MODE: gql`mutation SwitchToContributionMode {
          switchToContributionMode(input: {}) {
            integer
          }
        }`
    },
    subscriptions: {}
}