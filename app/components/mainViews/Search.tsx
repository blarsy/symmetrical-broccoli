import React, { useContext, useEffect, useState } from "react"
import LoadedList from "../LoadedList"
import { Resource } from "@/lib/schema"
import { IconButton, Text, TextInput } from "react-native-paper"
import { AppContext } from "../AppContextProvider"
import { t } from "@/i18n"
import { GestureResponderEvent, StyleSheet, TouchableOpacity, View } from "react-native"
import { RouteProps } from "@/lib/utils"
import { useDebounce } from "usehooks-ts"
import MainResourceImage from "../resources/MainResourceImage"
import CategoriesSelect from "../form/CategoriesSelect"
import { lightPrimaryColor, primaryColor } from "../layout/constants"
import Images from '@/Images'
import { CheckboxGroup } from "../layout/lib"
import { ScrollView } from "react-native-gesture-handler"
import dayjs from "dayjs"
import AccordionItem from "../AccordionItem"
import { SearchFilterContext, SearchOptions } from "../SearchFilterContextProvider"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import ViewResource from "../resources/ViewResource"
import SimpleBackHeader from "../layout/SimpleBackHeader"
import ViewAccount from "./ViewAccount"

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

interface ResourceCartProps {
    onPress: ((event: GestureResponderEvent) => void) | undefined,
    resource: Resource
    onChatOpen: (resource: Resource) => void
}

export const ResourceCard = ({ onPress, resource, onChatOpen }: ResourceCartProps) => {
    const appContext = useContext(AppContext)
    return <TouchableOpacity style={{ display: 'flex', alignItems: 'center', flexDirection: 'row', gap: 10, 
        paddingHorizontal: 8, paddingVertical: 5, backgroundColor: lightPrimaryColor, 
        borderRadius: 15 }} onPress={onPress}>
        <MainResourceImage resource={resource} />
        <View style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <Text variant="displaySmall" style={{ color: primaryColor, alignSelf: 'flex-end', fontSize: 10 }}>{`${t('published_at')} ${dayjs(resource.created).format(t('dateFormat'))}`}</Text>
            <View style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Text variant="displayLarge">{resource.title}</Text>
                <Text variant="displaySmall" style={{ color: primaryColor, fontSize: 10 }}>{`${t('brought_by_label')} ${resource.account?.name}`}</Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    { resource.canBeGifted && <Text variant="bodySmall" style={{ textTransform: 'uppercase', fontSize: 10 }}>{t('canBeGifted_label')}</Text>}
                    { resource.canBeExchanged && <Text variant="bodySmall" style={{ textTransform: 'uppercase', fontSize: 10 }}>{t('canBeExchanged_label')}</Text>}
                </View>
            </View>
            { (!appContext.state.account || resource.account!.id != appContext.state.account.id) && <IconButton style={{ borderRadius: 0, alignSelf: 'flex-end' }} size={15} icon={Images.Chat}
                onPress={() => onChatOpen(resource)}/> }
        </View>
    </TouchableOpacity>
}

const SearchResults = ({ route, navigation }: RouteProps) => {
    const appContext = useContext(AppContext)
    const searchFilterContext = useContext(SearchFilterContext)

    const debouncedFilters = useDebounce(searchFilterContext.filter, 700)

    useEffect(() => {
        if(appContext.state.categories.data) {
            searchFilterContext.actions.requery(appContext.state.categories.data)
        }
    }, [debouncedFilters])

    return <ScrollView style={{ flexDirection: 'column', margin: 10, flex:1 }}>
        <SearchBox onChange={text => searchFilterContext.actions.setSearchFilter({ search: text, categories: searchFilterContext.filter.categories, options: searchFilterContext.filter.options })} value={searchFilterContext.filter.search} />
        <CategoriesSelect value={searchFilterContext.filter.categories} labelVariant="bodyMedium"
            onChange={categories => searchFilterContext.actions.setSearchFilter({ search: searchFilterContext.filter.search, categories, options: searchFilterContext.filter.options })} />
        <AccordionItem title={t('options_title')}>
            <View style={{ flexDirection: 'column' }}>
            <CheckboxGroup title={''} options={{
                    isProduct: t('isProduct_label'), isService: t('isService_label') }} values={searchFilterContext.filter.options as any}
                onChanged={values => searchFilterContext.actions.setSearchFilter({ search: searchFilterContext.filter.search, 
                    categories: searchFilterContext.filter.categories, 
                    options: values as any as SearchOptions })} />
                <View style={{
                    borderBottomColor: 'black',
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderStyle: 'dashed'
                }} />
            <CheckboxGroup title={''} options={{ canBeTakenAway: t('canBeTakenAway_label'), canBeDelivered: t('canBeDelivered_label')}} values={searchFilterContext.filter.options as any}
                onChanged={values => searchFilterContext.actions.setSearchFilter({ search: searchFilterContext.filter.search, 
                    categories: searchFilterContext.filter.categories, 
                    options: values as any as SearchOptions })} />
                <View style={{
                    borderBottomColor: 'black',
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderStyle: 'dashed'
                }} />
            <CheckboxGroup title={''} options={{ canBeExchanged: t('canBeExchanged_label'), canBeGifted: t('canBeGifted_label') }} values={searchFilterContext.filter.options as any}
                onChanged={values => searchFilterContext.actions.setSearchFilter({ search: searchFilterContext.filter.search, 
                    categories: searchFilterContext.filter.categories, 
                    options: values as any as SearchOptions })} />
            </View>
        </AccordionItem>

        <LoadedList style={{ padding: 0 }} contentContainerStyle={{ gap: 20 }} loading={searchFilterContext.results.loading || appContext.state.categories.loading} error={searchFilterContext.results.error} data={searchFilterContext.results.data}
            displayItem={(res, idx) => {
                const resource = res as Resource
                return <ResourceCard 
                    key={idx} resource={resource} 
                    onChatOpen={() => {
                        appContext.actions.ensureConnected('introduce_yourself', '', (token, account) => {
                            navigation.navigate('chat', {
                                screen: 'conversation',
                                params: {
                                    resourceId: resource.id,
                                    otherAccountId: account.id
                                }
                            })
                        })
                    }}
                    onPress={() => navigation.navigate('viewResource', { resourceId: resource.id })} />
                }} />
    </ScrollView>
}

export default function Search ({ route, navigation }: RouteProps) {
    return <StackNav.Navigator screenOptions={{ contentStyle: { backgroundColor: '#fff' } }}>
        <StackNav.Screen name="searchResults" component={SearchResults} options={{ headerShown: false }} />
        <StackNav.Screen name="viewResource" key="viewResource" options={{ header: SimpleBackHeader }} component={ViewResource} />
        <StackNav.Screen name="viewAccount" key="viewAccount" options={{ header: SimpleBackHeader }} component={ViewAccount} />
    </StackNav.Navigator>
}