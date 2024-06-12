import { createContext, useState } from "react"
import { Category, Resource, fromServerGraphResources } from "@/lib/schema"
import React from "react"
import { gql, useLazyQuery } from "@apollo/client"
import DataLoadState, { fromData, fromError, initial } from "@/lib/DataLoadState"
import { t } from "@/i18n"

export interface SearchOptions {
    isProduct: boolean
    isService: boolean
    canBeTakenAway: boolean
    canBeDelivered: boolean
    canBeExchanged: boolean
    canBeGifted: boolean
}

export interface SearchFilterState {
    search: string
    categories: Category[]
    options: SearchOptions
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

const blankSearchFilter: SearchFilterState = { categories: [], options: { canBeDelivered: false, canBeExchanged: false, canBeGifted: false, canBeTakenAway: false, isProduct: false, isService: false }, search: '' }

export const SUGGESTED_RESOURCES = gql`query SuggestedResources($searchTerm: String, $isService: Boolean, $isProduct: Boolean, $categoryCodes: [String], $canBeTakenAway: Boolean, $canBeGifted: Boolean, $canBeExchanged: Boolean, $canBeDelivered: Boolean) {
    suggestedResources(
      searchTerm: $searchTerm
      canBeDelivered: $canBeDelivered
      canBeExchanged: $canBeExchanged
      canBeGifted: $canBeGifted
      canBeTakenAway: $canBeTakenAway
      isProduct: $isProduct
      isService: $isService
      categoryCodes: $categoryCodes
    ) {
      nodes {
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
    const [getSuggestedResources, { data, loading, error }] = useLazyQuery(SUGGESTED_RESOURCES, { variables: {
        categoryCodes: searchFilterState.categories.map(cat => cat.code.toString()),
        searchTerm: searchFilterState.search,
        ...searchFilterState.options
    } })

    const actions: SearchFilterActions = {
        setSearchFilter: async newFilter => {
            setSearchFilterState(newFilter)
        },
        requery: async (categories: Category[]) => {
            setSearchResults(initial(true, [] as Resource[]))
            try {
                const res = await getSuggestedResources({ variables: {
                    categoryCodes: searchFilterState.categories.map(cat => cat.code.toString()),
                    searchTerm: searchFilterState.search,
                    ...searchFilterState.options
                }})
                setSearchResults(fromData(fromServerGraphResources(res.data.suggestedResources.nodes, categories)))
            }
            catch(e) {
                setSearchResults(fromError(e, t('requestError')))
            }
        }
    }

    return <SearchFilterContext.Provider value={{ filter: searchFilterState, results: searchResults, actions}}>
        {children}
    </SearchFilterContext.Provider>
}

export default SearchFilterContextProvider