import { createContext, useState } from "react"
import { Category } from "@/lib/schema"
import React from "react"

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
}

interface SearchFilterContext {
    state: SearchFilterState,
    actions: SearchFilterActions
}

interface Props {
    children: JSX.Element
}

const blankSearchFilter: SearchFilterState = { categories: [], options: { canBeDelivered: false, canBeExchanged: false, canBeGifted: false, canBeTakenAway: false, isProduct: false, isService: false }, search: '' }

export const SearchFilterContext = createContext<SearchFilterContext>({
    state: blankSearchFilter, 
    actions: {
        setSearchFilter: () => {}
    }
})

const SearchFilterContextProvider = ({ children }: Props) => {
    const [searchFilterState, setSearchFilterState] = useState(blankSearchFilter)

    const actions: SearchFilterActions = {
        setSearchFilter: async newFilter => {
            setSearchFilterState(newFilter)
        }
    }

    return <SearchFilterContext.Provider value={{ state: searchFilterState, actions}}>
        {children}
    </SearchFilterContext.Provider>
}

export default SearchFilterContextProvider