
import React, { PropsWithChildren, useContext, useEffect, useState } from "react"
import LoadedList from "../LoadedList"
import { beginOperation, fromData, fromError, initial } from "@/lib/DataLoadState"
import { Resource } from "@/lib/schema"
import { Icon, IconButton, List, Text, TextInput } from "react-native-paper"
import { getSuggestions } from "@/lib/api"
import { AppContext, SearchFilter, SearchOptions } from "../AppContextProvider"
import { t } from "@/i18n"
import { TouchableOpacity, View } from "react-native"
import { RouteProps } from "@/lib/utils"
import { useDebounce } from "usehooks-ts"
import MainResourceImage from "../MainResourceImage"
import ResponsiveListItem from "../ResponsiveListItem"
import CategoriesSelect from "../form/CategoriesSelect"
import { lightPrimaryColor, primaryColor } from "../layout/constants"
import Images from '@/Images'
import { CheckboxGroup } from "../layout/lib"
import { ScrollView } from "react-native-gesture-handler"

interface SearchBoxProps {
    onChange: (searchText: string) => void
    value: string
}
const SearchBox = ({ onChange, value }: SearchBoxProps) => {
    return <View>
        <TextInput mode="outlined" onChangeText={onChange} value={value} left={<TextInput.Icon icon="magnify"/>}/>
    </View>
}

type AccordionItemPros = PropsWithChildren<{
    title: string;
  }>
  
function AccordionItem({ children, title }: AccordionItemPros): JSX.Element {
    const [ expanded, setExpanded ] = useState(false)


    const body = <View>{ children }</View>
  
    return (
      <View>
        <TouchableOpacity onPress={ () => setExpanded(!expanded) }>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingLeft: 16, paddingRight: 16 }}>
                <Text variant="headlineMedium">{ title }</Text>
                <Icon source={ expanded ? 'chevron-up' : 'chevron-down' }
                    size={20} />
            </View>
        </TouchableOpacity>
        { expanded && body }
      </View>
    )
  }

export default function Search ({ route, navigation }: RouteProps) {
    const appContext = useContext(AppContext)
    const [resources, setResources] = useState(initial<Resource[]>(true, []))
    const load = async(filter: SearchFilter) => {
        try{
            setResources(beginOperation())
            const queried = await getSuggestions(appContext.state.token.data!, filter.search, filter.categories.map(cat => cat.id.toString()), filter.options)
            setResources(fromData(queried))
        } catch(e) {
            setResources(fromError(e, t('requestError')))
        }
    }
    const debouncedFilters = useDebounce(appContext.state.searchFilter, 700)

    useEffect(() => {
        load(appContext.state.searchFilter)
    }, [debouncedFilters])

    return <ScrollView style={{ flexDirection: 'column', margin: 10, flex:1 }}>
        <SearchBox onChange={text => appContext.actions.setSearchFilter({ search: text, categories: appContext.state.searchFilter.categories, options: appContext.state.searchFilter.options })} value={appContext.state.searchFilter.search} />
        <CategoriesSelect value={appContext.state.searchFilter.categories}
            onChange={categories => appContext.actions.setSearchFilter({ search: appContext.state.searchFilter.search, categories, options: appContext.state.searchFilter.options })} />
        <AccordionItem title={t('options_title')}>
            <CheckboxGroup title={''} options={{
                isProduct: t('isProduct_label'), isService: t('isService_label'), canBeTakenAway: t('canBeTakenAway_label'), 
                canBeDelivered: t('canBeDelivered_label'), canBeExchanged: t('canBeExchanged_label'), canBeGifted: t('canBeGifted_label')
            }} values={appContext.state.searchFilter.options as any}
            onChanged={values => appContext.actions.setSearchFilter({ search: appContext.state.searchFilter.search, 
                categories: appContext.state.searchFilter.categories, 
                options: values as any as SearchOptions })} />
        </AccordionItem>

        <LoadedList loading={resources.loading} error={resources.error} data={resources.data}
            displayItem={(resource, idx) => <ResponsiveListItem onPress={() => navigation.navigate('viewResource', { resource })} key={idx} title={resource.title} 
            description={<View style={{ flexDirection: 'column' }}>
                <Text variant="bodySmall" style={{ color: primaryColor }}>{resource.account?.name}</Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    { resource.canBeGifted && <Text variant="bodySmall" style={{ textTransform: 'uppercase' }}>{t('canBeGifted_label')}</Text>}
                    { resource.canBeExchanged && <Text variant="bodySmall" style={{ textTransform: 'uppercase' }}>{t('canBeExchanged_label')}</Text>}
                </View>
            </View>} style={{ margin: 0, padding: 0, backgroundColor: lightPrimaryColor, paddingLeft: 6 }}
            left={() => <MainResourceImage resource={resource} />} right={p => <View style={{ justifyContent: 'flex-end' }}>
                <IconButton style={{ borderRadius: 0 }} size={15} icon={Images.Chat} onPress={() => navigation.navigate('chat', { resourceId: resource.id })}/>
            </View>}
        />}/>
    </ScrollView>

}