import { Account, Category, Resource } from "./schema"
import { GET_RESOURCE } from "./utils"
import { GraphQlOp } from "./storiesUtil"
import { SUGGEST_RESOURCES } from "@/components/SearchFilterContextProvider"
import { ACCOUNT_LOCATION } from "./useProfileAddress"
import { GraphQlLib } from "./backendFacade"
import { v4 } from "uuid"

const createRes = (id: string, account: Account, title: string, description: string, categories: Category[], imgPubIds: string[]): Resource => ({
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
    deleted: null,
    specificLocation: null,
    price: null,
    inActiveCampaign: false
})

const account1 = { id: v4(), name: 'Super artisan', email: 'me@me.com', avatarImageUrl: undefined, avatarPublicId: 'cwd3apntbv1z2jdf1ocf' } as Account & { avatarPublicId?: string }
const account2 = { id: v4(), name: 'Serial Jardinier', email: 'serial@jardin.com', avatarPublicId: 'zkuqb85k5v1xvjdx0yjv' } as Account & { avatarPublicId?: string }

const resource1 = createRes(v4(), account1, 'Super ressource', 'Description de la super ressource', [], ['djuwsbgtuyhkp7yz3v1t'])
const resource2 = createRes(v4(), account1, 'Un objet inutilisé', `Un objet que je n'utilise plus depuis des lustres, mais que quelqu'un adorera, c'est sûr !`, [], ['dcluoaiiblyuotymqitq','b1hpc5p1mgz1qmcfjghh'])
const resource3 = createRes(v4(), account2, 'Ressource étonnante', `Avec cette ressource, vous allez faire parler de vous...`, [], ['jagfatfcf9e4oeu75d8s'])

const makeSearchResourceResult = (resources: Resource[]) => resources.map(resource => ({
    accountsPublicDatumByAccountId: {
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
    },
    locationBySpecificLocationId: null
}))

const makeGetResourceGraphQlOp = (res: Resource) => ({
  query: GET_RESOURCE,
  variables: { id: res.id },
  result: {
      resourceById: {
          accountsPublicDatumByAccountId: {
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
            deleted: res.deleted,
            locationBySpecificLocationId: null
      }
  }
})

const makeGetAccountGraphQlOp = (resources: Resource[], account: Account & { avatarPublicId?: string }) => ({
  query: GraphQlLib.queries.GET_ACCOUNT,
  variables: { id: account.id },
  result: {
    getAccountPublicInfo: {
      name: account.name,
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
          accountsPublicDatumByAccountId: {
            id: account.id
          }
        }))
      },
      imageByAvatarImageId: {
        publicId: account.avatarPublicId,
      },
      locationByLocationId: null
    }
  }
})

export default {
    searchResultWithoutLocation: {
        query: SUGGEST_RESOURCES,
        variables: {
          excludeUnlocated:false,
          referenceLocationLatitude:0,
          referenceLocationLongitude:0,
          distanceToReferenceLocation:50,
          categoryCodes:[],
          searchTerm:"",
          canBeDelivered:false,
          canBeExchanged:false,
          canBeGifted:false,
          canBeTakenAway:false,
          isProduct:false,
          isService:false
        },
        result: {
          suggestedResources: {
            resources: makeSearchResourceResult([resource1, resource2, resource3])
          }
        }
    },
    searchResultWithDefaultAccountLocation: {
      query: SUGGEST_RESOURCES,
      variables: {
        excludeUnlocated:false,
        referenceLocationLatitude:50,
        referenceLocationLongitude:3,
        distanceToReferenceLocation:50,
        categoryCodes:[],
        searchTerm:"",
        canBeDelivered:false,
        canBeExchanged:false,
        canBeGifted:false,
        canBeTakenAway:false,
        isProduct:false,
        isService:false
      },
      result: {
        suggestedResources: {
          resources: makeSearchResourceResult([resource1, resource2, resource3])
        }
      }
  },
    getResource1ToView: makeGetResourceGraphQlOp(resource1),
    getResource2ToView: makeGetResourceGraphQlOp(resource2),
    getResource3ToView: makeGetResourceGraphQlOp(resource3),
    getAccount1: makeGetAccountGraphQlOp([ resource1, resource2 ], account1),
    getAccount2: makeGetAccountGraphQlOp([ resource3 ], account2),
    getAccountLocation: {
      query: ACCOUNT_LOCATION,
      variables: { id: 1 },
      result: {
        getAccountPublicInfo: {
          id: 1,
          locationByLocationId: {
            address: 'Rue de la rue, 1',
            latitude: 50,
            longitude: 3,
            id: 1
          }
        }
      }
    },
    getNoAccountLocation: {
      query: ACCOUNT_LOCATION,
      variables: { id: 1 },
      result: {
        getAccountPublicInfo: {
          id: 1,
          locationByLocationId: null
        }
      }
    }
} as { [name: string]: GraphQlOp }