import { t } from "@/i18n"
import React from "react"
import { View } from "react-native"
import { Text } from "react-native-paper"
import ListOf from "../ListOf"
import { aboveMdWidth } from "@/lib/utils"
import ResourceCard from "./ResourceCard"
import { Resource } from "@/lib/schema"

const exampleResources: Resource[] = [{
    id: 1, 
    title: t('title_example_resource_available_timeslots'), 
    description: t('description_example_resource_available_timeslots'), 
    images: [{ publicId: 'xz5oydf7u5lj2rjkuda1' }],
    canBeDelivered: true, canBeExchanged: true, canBeGifted: true, canBeTakenAway: true, categories: [],
    created: new Date(), isProduct: true, isService: true, deleted: null
},{
    id: 2, 
    title: t('title_example_resource_things_to_rent'), 
    description: t('description_example_resource_things_to_rent'), 
    images: [{ publicId: 'jqmyhsmx1led7nhvilp3' }],
    canBeDelivered: true, canBeExchanged: true, canBeGifted: true, canBeTakenAway: true, categories: [],
    created: new Date(), isProduct: true, isService: true, deleted: null
},{
    id: 3, 
    title: t('title_example_resource_unused_object'), 
    description: t('description_example_resource_unused_object'), 
    images: [{ publicId: 'e1cz5k4rxiwpbw9ekidj' }],
    canBeDelivered: true, canBeExchanged: true, canBeGifted: true, canBeTakenAway: true, categories: [],
    created: new Date(), isProduct: true, isService: true, deleted: null
}] 

export default () => {
    return <View style={{ flexDirection: 'column', alignItems: 'stretch' }}>
        <Text variant="headlineMedium" style={{ textAlign: 'center', padding: 20 }}>{t('create_circular_economy')}</Text>
        <View style={{ gap: 8, padding: aboveMdWidth() ? 20 : 5 }}>
            <ListOf data={exampleResources}
                displayItem={(resource, idx) => <ResourceCard isExample key={idx} resource={resource}
                    viewRequested={() => {}} deleteRequested={() => {}}
                    editRequested={() => {}}
                />}
            />
        </View>
    </View>
}