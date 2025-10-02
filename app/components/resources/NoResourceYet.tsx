import { t } from "@/i18n"
import React from "react"
import { View } from "react-native"
import { Text } from "react-native-paper"
import ResourceCard from "./ResourceCard"
import { Resource } from "@/lib/schema"
import LoadedList from "../LoadedList"

const exampleResources: Resource[] = [{
    id: 1, 
    title: t('childClothExampleResourceTitle'), 
    description: t('description_example_resource_available_timeslots'), 
    images: [{ publicId: 'uyn4yzdh6iiqzkrd33py' }],
    canBeDelivered: true, canBeExchanged: true, canBeGifted: true, canBeTakenAway: true, categories: [],
    created: new Date(), isProduct: true, isService: true, deleted: null,
    specificLocation: null, price: null
},{
    id: 2, 
    title: t('mangasResourceTitle'), 
    description: t('description_example_resource_unused_object'), 
    images: [{ publicId: 'he265cbgcsaqegbdsxy8' }],
    canBeDelivered: true, canBeExchanged: true, canBeGifted: true, canBeTakenAway: true, categories: [],
    created: new Date(), isProduct: true, isService: true, deleted: null,
    specificLocation: null, price: null
}, {
    id: 3, 
    title: t('title_example_resource_things_to_rent'), 
    description: t('description_example_resource_things_to_rent'), 
    images: [{ publicId: 'jqmyhsmx1led7nhvilp3' }],
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