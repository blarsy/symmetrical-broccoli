
import React, { useContext, useEffect, useState } from "react"
import LoadedList from "../LoadedList"
import { fromData, fromError, initial } from "@/lib/DataLoadState"
import { Category, Resource } from "@/lib/schema"
import { Text, TextInput } from "react-native-paper"
import { getSuggestions } from "@/lib/api"
import { AppContext } from "../AppContextProvider"
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
    const [resources, setResources] = useState(initial<Resource[]>(true))
    const [filters, setFilters] = useState({ search: '', categories: [] as Category[] })
    const load = async(searchText: string, categories: Category[]) => {
        try{
            const queried = await getSuggestions(appContext.state.token.data!, searchText, categories.map(cat => cat.id.toString()))
            setResources(fromData(queried))
        } catch(e) {
            setResources(fromError(e, t('requestError')))
        }
    }
    const debouncedFilters = useDebounce(filters, 1000)

    useEffect(() => {
        load(filters.search, filters.categories)
    }, [debouncedFilters])

    return <View style={{ flexDirection: 'column', margin: 10, flex:1 }}>
        <SearchBox onChange={text => setFilters({ search: text, categories: filters.categories })} value={filters.search} />
        <CategoriesSelect value={filters.categories}
            onChange={categories => setFilters({ search: filters.search, categories })} />
        <LoadedList loading={resources.loading} error={resources.error} data={resources.data}
            displayItem={(resource, idx) => <ResponsiveListItem onPress={() => navigation.navigate('viewResource', { resource })} key={idx} title={resource.title} 
            description={<Text variant="bodySmall" style={{ color: primaryColor }}>{resource.account?.name}</Text>} style={{ margin: 0, padding: 0 }}
            left={() => <MainResourceImage resource={resource} />}
        />}/>
    </View>

}