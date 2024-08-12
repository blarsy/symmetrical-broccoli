import React, { useContext, useEffect } from "react"
import LoadedList from "../LoadedList"
import { Resource } from "@/lib/schema"
import { TextInput } from "react-native-paper"
import { t } from "@/i18n"
import { StyleSheet, View } from "react-native"
import { RouteProps } from "@/lib/utils"
import { useDebounce } from "usehooks-ts"
import CategoriesSelect from "../form/CategoriesSelect"
import Images from '@/Images'
import { CheckboxGroup, Hr } from "../layout/lib"
import { ScrollView } from "react-native-gesture-handler"
import AccordionItem from "../AccordionItem"
import { SearchFilterContext, SearchOptions } from "../SearchFilterContextProvider"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import ViewResource from "../resources/ViewResource"
import SimpleBackHeader from "../layout/SimpleBackHeader"
import ViewAccount from "./ViewAccount"
import { AppContext } from "../AppContextProvider"
import useUserConnectionFunctions from "@/lib/useUserConnectionFunctions"
import FoundResourceCard from "../resources/FoundResourceCard"

const StackNav = createNativeStackNavigator()

interface SearchBoxProps {
    onChange: (searchText: string) => void
    value: string
}
const SearchBox = ({ onChange, value }: SearchBoxProps) => {
    return <View>
        <TextInput dense placeholder={t('search_hint')} mode="outlined" onChangeText={onChange} value={value} right={<TextInput.Icon style={{ borderRadius: 0, marginRight: 10 }} size={17} icon={Images.Search}/>}/>
    </View>
}

const SearchResults = ({ route, navigation }: RouteProps) => {
    const appContext = useContext(AppContext)
    const searchFilterContext = useContext(SearchFilterContext)
    const { ensureConnected } = useUserConnectionFunctions()

    const debouncedFilters = useDebounce(searchFilterContext.filter, 700)

    useEffect(() => {
        if(appContext.categories.data) {
            searchFilterContext.actions.requery(appContext.categories.data)
        }
    }, [debouncedFilters])

    return <ScrollView style={{ flexDirection: 'column', margin: 10, flex:1 }}>
        <SearchBox onChange={text => searchFilterContext.actions.setSearchFilter({ search: text, categories: searchFilterContext.filter.categories, options: searchFilterContext.filter.options })} value={searchFilterContext.filter.search} />
        <CategoriesSelect inline value={searchFilterContext.filter.categories} labelVariant="bodyMedium"
            onChange={categories => searchFilterContext.actions.setSearchFilter({ search: searchFilterContext.filter.search, categories, options: searchFilterContext.filter.options })} />
        <Hr />
        <AccordionItem title={t('options_title')}>
            <View style={{ flexDirection: 'column' }}>
                <CheckboxGroup title={''} options={{
                        isProduct: t('isProduct_label'), isService: t('isService_label') }} values={searchFilterContext.filter.options as any}
                    onChanged={values => searchFilterContext.actions.setSearchFilter({ search: searchFilterContext.filter.search, 
                        categories: searchFilterContext.filter.categories, 
                        options: values as any as SearchOptions })} />
                <Hr />
                <CheckboxGroup title={''} options={{ canBeTakenAway: t('canBeTakenAway_label'), canBeDelivered: t('canBeDelivered_label')}} values={searchFilterContext.filter.options as any}
                    onChanged={values => searchFilterContext.actions.setSearchFilter({ search: searchFilterContext.filter.search, 
                        categories: searchFilterContext.filter.categories, 
                        options: values as any as SearchOptions })} />
                <Hr />
                <CheckboxGroup title={''} options={{ canBeExchanged: t('canBeExchanged_label'), canBeGifted: t('canBeGifted_label') }} values={searchFilterContext.filter.options as any}
                    onChanged={values => searchFilterContext.actions.setSearchFilter({ search: searchFilterContext.filter.search, 
                        categories: searchFilterContext.filter.categories, 
                        options: values as any as SearchOptions })} />
            </View>
        </AccordionItem>

        <LoadedList style={{ padding: 0 }} contentContainerStyle={{ gap: 20 }} 
            loading={searchFilterContext.results.loading || appContext.categories.loading} 
            error={searchFilterContext.results.error} data={searchFilterContext.results.data}
            displayItem={(res, idx) => {
                
                const resource = res as Resource
                return <FoundResourceCard
                    key={idx} resource={resource} 
                    onChatOpen={res => {
                        ensureConnected('introduce_yourself', '', () => {
                            setTimeout(() => navigation.navigate('chat', {
                                screen: 'conversation',
                                params: {
                                    resourceId: resource.id,
                                    otherAccountId: res.account!.id
                                }
                            }))
                        })
                    }}
                    onPress={() => navigation.navigate('viewResource', { resourceId: resource.id })} />
                }} />
    </ScrollView>
}

export default function Search({ route, navigation }: RouteProps) {
    return <StackNav.Navigator screenOptions={{ contentStyle: { backgroundColor: '#fff' } }}>
        <StackNav.Screen name="searchResults" component={SearchResults} options={{ headerShown: false }} />
        <StackNav.Screen name="viewResource" key="viewResource" options={{ header: SimpleBackHeader }} component={ViewResource} />
        <StackNav.Screen name="viewAccount" key="viewAccount" options={{ header: SimpleBackHeader }} component={ViewAccount} />
    </StackNav.Navigator>
}