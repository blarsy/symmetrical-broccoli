
import React, { useContext, useEffect, useState } from "react"
import LoadedList from "../LoadedList"
import { fromData, fromError, initial } from "@/lib/DataLoadState"
import { Resource } from "@/lib/schema"
import { List, TextInput } from "react-native-paper"
import { suggestions } from "@/lib/api"
import { AppContext } from "../AppContextProvider"
import { t } from "@/i18n"
import { Image, View } from "react-native"
import { RouteProps } from "@/lib/utils"
import { imgUrl } from "@/lib/settings"
import { useDebounce } from "usehooks-ts"
import MainResourceImage from "../MainResourceImage"

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
    const [searchText, setSearchText] = useState('')
    const load = async(searchText: string) => {
        try{
            const queried = await suggestions(appContext.state.token.data!, searchText)
            setResources(fromData(queried))
        } catch(e) {
            setResources(fromError(e, t('requestError')))
        }
    }
    const debouncedSearchText = useDebounce(searchText, 1000)

    useEffect(() => {
        load(debouncedSearchText)
    }, [debouncedSearchText])

    return <View style={{ flexDirection: 'column', margin: 10, flex:1 }}>
        <SearchBox onChange={setSearchText} value={searchText} />
        <LoadedList loading={resources.loading} error={resources.error} data={resources.data}
            displayItem={(resource, idx) => <List.Item onPress={() => navigation.navigate('viewResource', { resource })} key={idx} title={resource.title} 
            description={resource.description} style={{ margin: 0, padding: 0 }}
            left={() => <MainResourceImage resource={resource} />}
        />}/>
    </View>

}