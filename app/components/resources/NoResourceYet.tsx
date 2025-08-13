import { t } from "@/i18n"
import React from "react"
import { View } from "react-native"
import { Text } from "react-native-paper"
import ResourceCard from "./ResourceCard"
import { Resource } from "@/lib/schema"
import LoadedList from "../LoadedList"

const exampleResources: Resource[] = [{
    id: 1, 
    title: t('title_example_resource_available_timeslots'), 
    description: t('description_example_resource_available_timeslots'), 
    images: [{ publicId: 'xz5oydf7u5lj2rjkuda1' }],
    canBeDelivered: true, canBeExchanged: true, canBeGifted: true, canBeTakenAway: true, categories: [],
    created: new Date(), isProduct: true, isService: true, deleted: null,
    specificLocation: null, price: null
},{
    id: 2, 
    title: t('title_example_resource_things_to_rent'), 
    description: t('description_example_resource_things_to_rent'), 
    images: [{ publicId: 'jqmyhsmx1led7nhvilp3' }],
    canBeDelivered: true, canBeExchanged: true, canBeGifted: true, canBeTakenAway: true, categories: [],
    created: new Date(), isProduct: true, isService: true, deleted: null,
    specificLocation: null, price: null
},{
    id: 3, 
    title: t('title_example_resource_unused_object'), 
    description: t('description_example_resource_unused_object'), 
    images: [{ publicId: 'e1cz5k4rxiwpbw9ekidj' }],
    canBeDelivered: true, canBeExchanged: true, canBeGifted: true, canBeTakenAway: true, categories: [],
    created: new Date(), isProduct: true, isService: true, deleted: null,
    specificLocation: null, price: null
}] 

export default () => {
    return <View style={{ flexDirection: 'column', borderColor: 'yellow', borderWidth: 0, flex: 1 }}>
        <Text variant="headlineMedium" style={{ textAlign: 'center', padding: 20 }}>{t('create_circular_economy')}</Text>
        <LoadedList data={exampleResources}
            contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}
            displayItem={(resource, idx) => <ResourceCard isExample key={idx} resource={resource}
            viewRequested={() => { } } deleteRequested={() => { } }
            editRequested={() => { } } />} loading={false}  />
    </View>
}