import { createContext, useState } from "react"
import { Category, Location, Resource, fromServerGraphResources } from "@/lib/schema"
import React from "react"
import { gql, useMutation } from "@apollo/client"
import DataLoadState, { fromData, fromError, initial } from "@/lib/DataLoadState"
import { t } from "@/i18n"
import { MAX_DISTANCE } from "@/lib/utils"

export interface SearchOptions {
  isProduct: boolean
  isService: boolean
  canBeTakenAway: boolean
  canBeDelivered: boolean
  canBeExchanged: boolean
  canBeGifted: boolean
}

export interface LocationSearchOptions {
  excludeUnlocated: boolean
  referenceLocation: Location | null
  distanceToReferenceLocation: number
}

export interface SearchFilterState {
    search: string
    categories: Category[]
    options: SearchOptions
    location: LocationSearchOptions
}

interface SearchFilterActions {
    setSearchFilter: (newFilter: SearchFilterState) => void
    requery: (categories: Category[]) => Promise<void>
}

interface SearchFilterContext {
    filter: SearchFilterState
    results: DataLoadState<Resource[]>
    actions: SearchFilterActions
}

interface Props {
    children: JSX.Element
}

const blankSearchFilter: SearchFilterState = { 
  categories: [], 
  options: { canBeDelivered: false, canBeExchanged: false, canBeGifted: false, canBeTakenAway: false, isProduct: false, isService: false }, 
  search: '',
  location: { distanceToReferenceLocation: MAX_DISTANCE, excludeUnlocated: false, referenceLocation: null }
}

export const SUGGEST_RESOURCES = gql`mutation SuggestResources($canBeDelivered: Boolean, $canBeExchanged: Boolean, $canBeGifted: Boolean, $canBeTakenAway: Boolean, $categoryCodes: [Int], $excludeUnlocated: Boolean = false, $isProduct: Boolean, $isService: Boolean, $referenceLocationLatitude: BigFloat = "0", $referenceLocationLongitude: BigFloat = "0", $searchTerm: String, $distanceToReferenceLocation: BigFloat = "0") {
  suggestedResources(
    input: {canBeDelivered: $canBeDelivered, canBeExchanged: $canBeExchanged, canBeGifted: $canBeGifted, canBeTakenAway: $canBeTakenAway, categoryCodes: $categoryCodes, distanceToReferenceLocation: $distanceToReferenceLocation, excludeUnlocated: $excludeUnlocated, isProduct: $isProduct, isService: $isService, referenceLocationLatitude: $referenceLocationLatitude, referenceLocationLongitude: $referenceLocationLongitude, searchTerm: $searchTerm}
  ) {
    resources {
      accountByAccountId {
        name
        id
      }
      created
      description
      title
      canBeExchanged
      canBeGifted
      resourcesImagesByResourceId {
        nodes {
          imageByImageId {
            publicId
          }
        }
      }
      expiration
      isProduct
      isService
      id
      canBeTakenAway
      canBeDelivered
      resourcesResourceCategoriesByResourceId {
        nodes {
          resourceCategoryCode
        }
      }
      locationBySpecificLocationId {
        address
        id
        latitude
        longitude
      }
      suspended
      paidUntil
    }
  }
}`

export const SearchFilterContext = createContext<SearchFilterContext>({
    filter: blankSearchFilter, 
    results: initial<Resource[]>(true, []),
    actions: {
        setSearchFilter: () => {},
        requery: async () => {}
    }
})

const SearchFilterContextProvider = ({ children }: Props) => {
    const [searchFilterState, setSearchFilterState] = useState(blankSearchFilter)
    const [searchResults, setSearchResults] = useState(initial(true, [] as Resource[]))
    const [suggestResources] = useMutation(SUGGEST_RESOURCES)

    const actions: SearchFilterActions = {
        setSearchFilter: async newFilter => {
            setSearchFilterState(newFilter)
        },
        requery: async (categories: Category[]) => {
            setSearchResults(initial(true, [] as Resource[]))
            try {
                const res = await suggestResources({ variables: {
                    categoryCodes: searchFilterState.categories.map(cat => cat.code),
                    searchTerm: searchFilterState.search,
                    ...searchFilterState.options,
                    excludeUnlocated: searchFilterState.location?.excludeUnlocated,
                    referenceLocationLatitude: (searchFilterState.location && searchFilterState.location.referenceLocation) ? searchFilterState.location.referenceLocation.latitude : 0,
                    referenceLocationLongitude: (searchFilterState.location && searchFilterState.location.referenceLocation) ? searchFilterState.location?.referenceLocation.longitude : 0,
                    distanceToReferenceLocation: searchFilterState.location?.distanceToReferenceLocation
                }})

                setSearchResults(fromData(fromServerGraphResources(res.data.suggestedResources.resources, categories)))
            }
            catch(e) {
                setSearchResults(fromError(e))
            }
        }
    }

    return <SearchFilterContext.Provider value={{ filter: searchFilterState, results: searchResults, actions}}>
        {children}
    </SearchFilterContext.Provider>
}

export default SearchFilterContextProvider