import React, { useContext, useEffect } from "react"
import LoadedList from "../LoadedList"
import { Resource } from "@/lib/schema"
import { ActivityIndicator, Text, TextInput } from "react-native-paper"
import { t } from "@/i18n"
import { View } from "react-native"
import { MAX_DISTANCE, RouteProps } from "@/lib/utils"
import { useDebounce } from "usehooks-ts"
import CategoriesSelect from "../form/CategoriesSelect"
import Images from '@/Images'
import { CheckboxGroup, Hr } from "../layout/lib"
import { ScrollView } from "react-native-gesture-handler"
import AccordionItem from "../AccordionItem"
import { LocationSearchOptions, SearchFilterContext, SearchOptions } from "../SearchFilterContextProvider"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import ViewResource from "../resources/ViewResource"
import SimpleBackHeader from "../layout/SimpleBackHeader"
import ViewAccount from "./ViewAccount"
import { AppContext } from "../AppContextProvider"
import useUserConnectionFunctions from "@/lib/useUserConnectionFunctions"
import FoundResourceCard from "../resources/FoundResourceCard"
import Slider from "@react-native-community/slider"
import LocationEdit from "../account/LocationEdit"
import OptionSelect from "../OptionSelect"
import useProfileAddress from "@/lib/useProfileAddress"

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

interface ProximitySelectorProps {
    value: LocationSearchOptions
    onChange: (newVal: LocationSearchOptions) => void
}

const ProximitySelector = ({ value, onChange }: ProximitySelectorProps) => {
    return <View style={{ flexDirection: 'column', alignContent: 'stretch', paddingBottom: 10 }}>
        <LocationEdit small style={{ paddingLeft: 10 }} location={value?.referenceLocation} 
            onLocationChanged={newLocation => {
                onChange({ distanceToReferenceLocation: value.distanceToReferenceLocation, 
                    excludeUnlocated: value.excludeUnlocated,
                    referenceLocation: newLocation,
                })
            }}
            onDeleteRequested={() => {
                onChange({ distanceToReferenceLocation: value.distanceToReferenceLocation, 
                    excludeUnlocated: value.excludeUnlocated,
                    referenceLocation: undefined,
                })
            }} />
        <Text variant="bodySmall" style={{ textAlign: 'center' }}>{t('max_distance_label', { distance: value.distanceToReferenceLocation.toLocaleString() })}</Text>
        <Slider  style={{ paddingVertical: 20, width: '80%', alignSelf: 'center' }} 
            disabled={!value.referenceLocation} lowerLimit={1} 
            maximumValue={MAX_DISTANCE} step={5} upperLimit={MAX_DISTANCE} 
            onValueChange={val => {
                onChange({ distanceToReferenceLocation: val,
                    excludeUnlocated: value.excludeUnlocated,
                    referenceLocation: value.referenceLocation
                })
            }} value={value.distanceToReferenceLocation} />
        <OptionSelect title={t('exclude_unlocated_label')} value={value.excludeUnlocated} onChange={val => {
            onChange({ distanceToReferenceLocation: value.distanceToReferenceLocation,
                excludeUnlocated: val,
                referenceLocation: value.referenceLocation
            })
        }} />
    </View>
}

const SearchResults = ({ route, navigation }: RouteProps) => {
    const appContext = useContext(AppContext)
    const searchFilterContext = useContext(SearchFilterContext)
    const { ensureConnected } = useUserConnectionFunctions()
    const { data: defaultAddress, loading: loadingAddress } = useProfileAddress()

    useEffect(() => {
        if(!loadingAddress) {
            searchFilterContext.actions.setSearchFilter({ search: searchFilterContext.filter.search, 
                categories: searchFilterContext.filter.categories, 
                options: searchFilterContext.filter.options,
                location: { ...searchFilterContext.filter.location, ...{ referenceLocation: defaultAddress === null ? undefined : defaultAddress } } })
        }
    }, [loadingAddress])

    const debouncedFilters = useDebounce(searchFilterContext.filter, 700)

    useEffect(() => {
        if(appContext.categories.data && !loadingAddress) {
            searchFilterContext.actions.requery(appContext.categories.data)
        }
    }, [debouncedFilters])

    return loadingAddress ? 
        <ActivityIndicator /> : 
        <ScrollView style={{ flexDirection: 'column', margin: 10, flex:1 }}>
            <SearchBox onChange={text => searchFilterContext.actions.setSearchFilter({ search: text, categories: searchFilterContext.filter.categories, options: searchFilterContext.filter.options, location: searchFilterContext.filter.location })} value={searchFilterContext.filter.search} />
            <CategoriesSelect inline value={searchFilterContext.filter.categories} labelVariant="bodyMedium"
                onChange={categories => searchFilterContext.actions.setSearchFilter({ search: searchFilterContext.filter.search, categories, options: searchFilterContext.filter.options, location: searchFilterContext.filter.location })} />
            <Hr />
            <AccordionItem title={t('options_title')} style={{ paddingBottom: 10 }}>
                <View style={{ flexDirection: 'column' }}>
                    <CheckboxGroup title={''} options={{
                            isProduct: t('isProduct_label'), isService: t('isService_label') }} values={searchFilterContext.filter.options as any}
                        onChanged={values => searchFilterContext.actions.setSearchFilter({ search: searchFilterContext.filter.search, 
                            categories: searchFilterContext.filter.categories, 
                            options: values as any as SearchOptions, 
                            location: searchFilterContext.filter.location })} />
                    <Hr />
                    <CheckboxGroup title={''} options={{ canBeTakenAway: t('canBeTakenAway_label'), canBeDelivered: t('canBeDelivered_label')}} values={searchFilterContext.filter.options as any}
                        onChanged={values => searchFilterContext.actions.setSearchFilter({ search: searchFilterContext.filter.search, 
                            categories: searchFilterContext.filter.categories, 
                            options: values as any as SearchOptions,
                            location: searchFilterContext.filter.location })} />
                    <Hr />
                    <CheckboxGroup title={''} options={{ canBeExchanged: t('canBeExchanged_label'), canBeGifted: t('canBeGifted_label') }} values={searchFilterContext.filter.options as any}
                        onChanged={values => searchFilterContext.actions.setSearchFilter({ search: searchFilterContext.filter.search, 
                            categories: searchFilterContext.filter.categories, 
                            options: values as any as SearchOptions,
                            location: searchFilterContext.filter.location })} />
                </View>
            </AccordionItem>
            <Hr />
            <AccordionItem title={t('proximity_title')}>
                <ProximitySelector value={searchFilterContext.filter.location}
                    onChange={val => {
                        searchFilterContext.actions.setSearchFilter({ ...searchFilterContext.filter, ...{ location: val } })
                    }} />
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