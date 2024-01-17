import React, { useContext, useEffect } from "react"
import LoadedList from "../LoadedList"
import { Resource, fromServerGraphResources } from "@/lib/schema"
import { IconButton, Text, TextInput } from "react-native-paper"
import { AppContext } from "../AppContextProvider"
import { t } from "@/i18n"
import { GestureResponderEvent, StyleSheet, TouchableOpacity, View } from "react-native"
import { RouteProps } from "@/lib/utils"
import { useDebounce } from "usehooks-ts"
import MainResourceImage from "../MainResourceImage"
import CategoriesSelect from "../form/CategoriesSelect"
import { lightPrimaryColor, primaryColor } from "../layout/constants"
import Images from '@/Images'
import { CheckboxGroup } from "../layout/lib"
import { ScrollView } from "react-native-gesture-handler"
import dayjs from "dayjs"
import AccordionItem from "../AccordionItem"
import { SearchFilterContext, SearchOptions } from "../SearchFilterContextProvider"
import { gql, useLazyQuery } from "@apollo/client"
import { EditResourceContext } from "../EditResourceContextProvider"
import { Link, NavigationHelpers, ParamListBase } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import ViewResource from "../ViewResource"
import SimpleBackHeader from "../layout/SimpleBackHeader"
import Chat from "./Chat"

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

const SUGGESTED_RESOURCES = gql`query SuggestedResources($isService: Boolean, $isProduct: Boolean, $categoryCodes: [String], $canBeTakenAway: Boolean, $canBeGifted: Boolean, $canBeExchanged: Boolean, $canBeDelivered: Boolean) {
    suggestedResources(
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

interface ResourceCartProps {
    onPress: ((event: GestureResponderEvent) => void) | undefined,
    resource: Resource
    onChatOpen: (resource: Resource) => void
}

const ResourceCard = ({ onPress, resource, onChatOpen }: ResourceCartProps) => {
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
            { resource.account!.id != appContext.state.account!.id && <IconButton style={{ borderRadius: 0, alignSelf: 'flex-end' }} size={15} icon={Images.Chat}
                onPress={() => onChatOpen(resource)}/> }
        </View>
    </TouchableOpacity>
}

const SearchResults = ({ route, navigation }: RouteProps) => {
    const searchFilterContext = useContext(SearchFilterContext)
    const editResourceState = useContext(EditResourceContext)
    const [getSuggestedArticles, { data, loading, error }] = useLazyQuery(SUGGESTED_RESOURCES, { variables: {
        categoryCodes: searchFilterContext.state.categories.map(cat => cat.code.toString()),
        ...searchFilterContext.state.options
    } })

    const debouncedFilters = useDebounce(searchFilterContext.state, 700)

    useEffect(() => {
        getSuggestedArticles({ variables: {
            categoryCodes: searchFilterContext.state.categories.map(cat => cat.code.toString()),
            ...searchFilterContext.state.options
        }})
    }, [debouncedFilters])

    return <ScrollView style={{ flexDirection: 'column', margin: 10, flex:1 }}>
        <SearchBox onChange={text => searchFilterContext.actions.setSearchFilter({ search: text, categories: searchFilterContext.state.categories, options: searchFilterContext.state.options })} value={searchFilterContext.state.search} />
        <CategoriesSelect value={searchFilterContext.state.categories} labelVariant="bodyMedium"
            onChange={categories => searchFilterContext.actions.setSearchFilter({ search: searchFilterContext.state.search, categories, options: searchFilterContext.state.options })} />
        <AccordionItem title={t('options_title')}>
            <View style={{ flexDirection: 'column' }}>
            <CheckboxGroup title={''} options={{
                    isProduct: t('isProduct_label'), isService: t('isService_label') }} values={searchFilterContext.state.options as any}
                onChanged={values => searchFilterContext.actions.setSearchFilter({ search: searchFilterContext.state.search, 
                    categories: searchFilterContext.state.categories, 
                    options: values as any as SearchOptions })} />
                <View style={{
                    borderBottomColor: 'black',
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderStyle: 'dashed'
                }} />
            <CheckboxGroup title={''} options={{ canBeTakenAway: t('canBeTakenAway_label'), canBeDelivered: t('canBeDelivered_label')}} values={searchFilterContext.state.options as any}
                onChanged={values => searchFilterContext.actions.setSearchFilter({ search: searchFilterContext.state.search, 
                    categories: searchFilterContext.state.categories, 
                    options: values as any as SearchOptions })} />
                <View style={{
                    borderBottomColor: 'black',
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderStyle: 'dashed'
                }} />
            <CheckboxGroup title={''} options={{ canBeExchanged: t('canBeExchanged_label'), canBeGifted: t('canBeGifted_label') }} values={searchFilterContext.state.options as any}
                onChanged={values => searchFilterContext.actions.setSearchFilter({ search: searchFilterContext.state.search, 
                    categories: searchFilterContext.state.categories, 
                    options: values as any as SearchOptions })} />
            </View>
        </AccordionItem>

        <LoadedList style={{ padding: 0 }} contentContainerStyle={{ gap: 20 }} loading={loading || editResourceState.state.categories.loading} error={error} data={data && data.suggestedResources && fromServerGraphResources(data.suggestedResources.nodes, editResourceState.state.categories.data!)}
            displayItem={(res, idx) => {
                const resource = res as Resource
                return <ResourceCard 
                    key={idx} resource={resource} 
                    onChatOpen={() => navigation.navigate('chat', {
                        screen: 'conversation',
                        params: {
                            resourceId: resource.id
                        }
                    })} 
                    onPress={() => navigation.navigate('viewResource', { resourceId: resource.id })} />
                }} />
    </ScrollView>
}

export default function Search ({ route, navigation }: RouteProps) {
    return <StackNav.Navigator screenOptions={{ contentStyle: { backgroundColor: '#fff' } }}>
        <StackNav.Screen name="searchResults" component={SearchResults} options={{ headerShown: false }} />
        <StackNav.Screen name="viewResource" key="viewResource" options={{ header: SimpleBackHeader }} component={ViewResource} />
    </StackNav.Navigator>
}