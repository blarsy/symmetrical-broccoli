
import React, { useContext, useEffect, useState } from "react"
import LoadedList from "../LoadedList"
import { fromData, fromError, initial } from "@/lib/DataLoadState"
import { Resource } from "@/lib/schema"
import { Text, TextInput } from "react-native-paper"
import { getSuggestions } from "@/lib/api"
import { AppContext, SearchFilter } from "../AppContextProvider"
import { t } from "@/i18n"
import { View } from "react-native"
import { RouteProps } from "@/lib/utils"
import { useDebounce } from "usehooks-ts"
import MainResourceImage from "../MainResourceImage"
import ResponsiveListItem from "../ResponsiveListItem"
import CategoriesSelect from "../form/CategoriesSelect"
import { primaryColor } from "../layout/constants"

interface SearchBoxProps {
    onChange: (searchText: string) => void
    value: string
}
const SearchBox = ({ onChange, value }: SearchBoxProps) => {
    return <View>
        <TextInput mode="outlined" onChangeText={onChange} value={value} left={<TextInput.Icon icon="magnify"/>}/>
    </View>
}

export default function Search ({ route, navigation }: RouteProps) {
    const appContext = useContext(AppContext)
    const [resources, setResources] = useState(initial<Resource[]>(true, []))
    const load = async(filter: SearchFilter) => {
        try{
            const queried = await getSuggestions(appContext.state.token.data!, filter.search, filter.categories.map(cat => cat.id.toString()))
            setResources(fromData(queried))
        } catch(e) {
            setResources(fromError(e, t('requestError')))
        }
    }
    const debouncedFilters = useDebounce(appContext.state.searchFilter, 1000)

    useEffect(() => {
        load(appContext.state.searchFilter)
    }, [debouncedFilters])

    return <View style={{ flexDirection: 'column', margin: 10, flex:1 }}>
        <SearchBox onChange={text => appContext.actions.setSearchFilter({ search: text, categories: appContext.state.searchFilter.categories })} value={appContext.state.searchFilter.search} />
        <CategoriesSelect value={appContext.state.searchFilter.categories}
            onChange={categories => appContext.actions.setSearchFilter({ search: appContext.state.searchFilter.search, categories })} />
        <LoadedList loading={resources.loading} error={resources.error} data={resources.data}
            displayItem={(resource, idx) => <ResponsiveListItem onPress={() => navigation.navigate('viewResource', { resource })} key={idx} title={resource.title} 
            description={<Text variant="bodySmall" style={{ color: primaryColor }}>{resource.account?.name}</Text>} style={{ margin: 0, padding: 0 }}
            left={() => <MainResourceImage resource={resource} />}
        />}/>
    </View>

}