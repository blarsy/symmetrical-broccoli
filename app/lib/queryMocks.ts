import { SUGGESTED_RESOURCES } from "@/components/SearchFilterContextProvider"
import { Account, Category, Resource } from "./schema"
import { GET_RESOURCE } from "./utils"
import { GraphQlOp } from "./storiesUtil"
import { GET_ACCOUNT } from "@/components/account/Account"

const createRes = (id: number, account: Account, title: string, description: string, categories: Category[], imgPubIds: string[]): Resource => ({
    account,
    created: new Date(),
    description,
    title,
    canBeExchanged: true,
    canBeGifted: true,
    images: imgPubIds.map(publicId => ({ publicId })),
    expiration: new Date(new Date().valueOf() + 24 * 60 * 60 * 1000),
    isProduct: true,
    isService: true,
    id,
    canBeTakenAway: true,
    categories,
    canBeDelivered: true,
    deleted: null
})

const account1 = { id: 1, name: 'Super artisan', email: 'me@me.com', avatarImageUrl: undefined, avatarPublicId: 'cwd3apntbv1z2jdf1ocf' } as Account & { avatarPublicId?: string }
const account2 = { id: 2, name: 'Serial Jardinier', email: 'serial@jardin.com', avatarPublicId: 'zkuqb85k5v1xvjdx0yjv' } as Account & { avatarPublicId?: string }

const resource1 = createRes(1, account1, 'Super ressource', 'Description de la super ressource', [], ['djuwsbgtuyhkp7yz3v1t'])
const resource2 = createRes(2, account1, 'Un objet inutilisé', `Un objet que je n'utilise plus depuis des lustres, mais que quelqu'un adorera, c'est sûr !`, [], ['dcluoaiiblyuotymqitq','b1hpc5p1mgz1qmcfjghh'])
const resource3 = createRes(3, account2, 'Ressource étonnante', `Avec cette ressource, vous allez faire parler de vous...`, [], ['jagfatfcf9e4oeu75d8s'])

const makeSearchResourceResult = (resources: Resource[]) => resources.map(resource => ({
    accountByAccountId: {
        name: resource.account?.name,
        id: resource.account?.id
      },
      created: resource.created,
      description: resource.description,
      title: resource.title,
      canBeExchanged: resource.canBeExchanged,
      canBeGifted: resource.canBeGifted,
      resourcesImagesByResourceId: {
        nodes: resource.images.map(img => ({
            imageByImageId: {
              publicId: img.publicId
            }
          }))
      },
      expiration: resource.expiration,
      isProduct: resource.isProduct,
      isService: resource.isService,
      id: resource.id,
      canBeTakenAway: resource.canBeTakenAway,
      canBeDelivered: resource.canBeDelivered,
      resourcesResourceCategoriesByResourceId: {
        nodes: resource.categories.map(cat => ({
            resourceCategoryCode: cat.code
          }))
      }
}))

const makeGetResourceGraphQlOp = (res: Resource) => ({
  query: GET_RESOURCE,
  variables: { id: res.id },
  result: {
      resourceById: {
          accountByAccountId: {
              email: res.account?.email,
              id: res.account?.id,
              name: res.account?.name,
              imageByAvatarImageId: {
                publicId: ''
              }
            },
            canBeDelivered: res.canBeDelivered,
            canBeExchanged: res.canBeExchanged,
            canBeGifted: res.canBeGifted,
            canBeTakenAway: res.canBeTakenAway,
            description: res.description,
            id: res.id,
            isProduct: res.isProduct,
            isService: res.isService,
            expiration: res.expiration,
            title: res.title,
            resourcesResourceCategoriesByResourceId: {
              nodes: res.categories.map(cat => ({
                  resourceCategoryCode: cat.code,
                })) 
            },
            resourcesImagesByResourceId: {
              nodes: res.images.map(img => ({
                  imageByImageId: {
                    publicId: img.publicId
                  }
                })) 
            },
            created: res.created,
            deleted: res.deleted
      }
  }
})

const makeGetAccountGraphQlOp = (resources: Resource[], account: Account & { avatarPublicId?: string }) => ({
  query: GET_ACCOUNT,
  variables: { id: account.id },
  result: {
    accountById: {
      email: account.email,
      name: account.email,
      resourcesByAccountId: {
        nodes: resources.map(res => ({
          id: res.id,
          canBeGifted: res.canBeGifted,
          canBeExchanged: res.canBeExchanged,
          title: res.title,
          resourcesImagesByResourceId: {
            nodes: res.images.map(img => ({
              imageByImageId: {
                publicId: img.publicId
              }
            }))
          },
          resourcesResourceCategoriesByResourceId: {
            nodes: res.categories.map(cat => ({
              resourceCategoryCode: cat.code
            })) 
          },
          accountByAccountId: {
            id: account.id
          }
        }))
      },
      imageByAvatarImageId: {
        publicId: account.avatarPublicId,
      }
    }
  }
})

export default {
    searchResult: {
        query: SUGGESTED_RESOURCES,
        variables: {
            searchTerm: '',
            canBeDelivered: false,
            canBeExchanged: false,
            canBeGifted: false,
            canBeTakenAway: false,
            isProduct: false,
            isService: false,
            categoryCodes: []
        },
        result: {
            suggestedResources: {
                nodes: makeSearchResourceResult([resource1, resource2, resource3])
            }
        }
    },
    getResource1ToView: makeGetResourceGraphQlOp(resource1),
    getResource2ToView: makeGetResourceGraphQlOp(resource2),
    getResource3ToView: makeGetResourceGraphQlOp(resource3),
    getAccount1: makeGetAccountGraphQlOp([ resource1, resource2 ], account1),
    getAccount2: makeGetAccountGraphQlOp([ resource3 ], account2),
} as { [name: string]: GraphQlOp }