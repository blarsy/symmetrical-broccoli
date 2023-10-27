import { RouteProps } from "@/lib/utils"
import React from "react"
import { Chip, Text } from "react-native-paper"
import { imgUrl } from "@/lib/settings"
import { Resource } from "@/lib/schema"
import { t } from "@/i18n"
import { Dimensions, Image, ScrollView, View } from "react-native"
import dayjs from "dayjs"
import SwiperFlatList from "react-native-swiper-flatlist"

interface ResourceViewFieldProps {
    title: string,
    children: JSX.Element,
    titleOnOwnLine?: boolean
}

const ResourceViewField = ({ title, children, titleOnOwnLine }: ResourceViewFieldProps) => <View style={{ 
        flexDirection: titleOnOwnLine ? "column": "row", gap: titleOnOwnLine ? 0: 10, alignItems: titleOnOwnLine ?  'flex-start' : 'center', borderBottomColor: '#000', borderBottomWidth: 1
    }}>
    <Text variant="titleMedium">{title}</Text>
    {children}
</View>

const getSwiperData = (resource: Resource) => {
    if(resource.images && resource.images.length > 0) {
        return resource.images.map((img, idx) => ({
            source: `${imgUrl}${img.path}`,
            alt: img.title,
            idx
        }))
    } else {
        return [{ source: '/placeholder.png', alt: 'placeholder'}]
    }
}

const ViewResource = ({ route, navigation }:RouteProps) => {
    const resource = route.params.resource as Resource
    
    let expirationText: string
    if(resource.expiration) {
        const dateObj = dayjs(resource.expiration)
        expirationText = `${dateObj.fromNow()} (${dateObj.format(t('dateTimeFormat'))})`
    } else {
        expirationText = ''
    }
    const windowDimension = Dimensions.get('window')
    const imgSize = Math.min( 300, Math.min(windowDimension.height, windowDimension.width) * 60 / 100)

    return <ScrollView style={{ flex: 1, flexDirection: 'column', margin: 10 }}>
        <View style={{ flex: 1, flexDirection: 'row', alignSelf: resource.images.length === 1 ? 'center': 'auto' }}>
            <SwiperFlatList data={getSwiperData(resource)} 
                renderItem= {({ item }) => <View>
                    <Image key={item.idx} source={{ uri: item.source}} alt={item.alt} width={imgSize} height={imgSize} style={{ width: imgSize, height: imgSize }}/>
            </View>} />
        </View>
        <ResourceViewField title={t('title_label')}>
            <Text style={{ textTransform: 'uppercase' }}>{resource.title}</Text>
        </ResourceViewField>
        <ResourceViewField title={t('description_label')} titleOnOwnLine>
            <Text>{resource.description}</Text>
        </ResourceViewField>
        { expirationText && <View>
            <ResourceViewField title={t('expiration_label')}>
                <Text>{expirationText}</Text>
            </ResourceViewField>
        </View>}
        { resource.categories && resource.categories.length > 0 && 
            <ResourceViewField title={t('resourceCategories_label')} titleOnOwnLine>
                <View style={{ flexDirection: "row", gap: 10, flexWrap: 'wrap' }}>
                    { resource.categories.map((cat, idx) => <Chip icon="label" key={idx}>{cat.name}</Chip>) }
                </View>
            </ResourceViewField>
        }
        { resource.conditions && resource.conditions.length > 0 && <View>
            <ResourceViewField title={t('conditions_label')} titleOnOwnLine>
                <View style={{ flexDirection: 'column' }}>
                    { resource.conditions.map((condition, idx) => <View key={idx} style={{ paddingBottom: 5, borderTopWidth: 1, borderTopColor: '#aaa' }}>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <Text variant="bodySmall">{t('title_label')}</Text>
                            <Text>{condition.title}</Text>
                        </View>
                        <Text variant="bodySmall">{t('description_label')}</Text>
                        <Text>{condition.description}</Text>
                    </View>)}
                </View>
            </ResourceViewField>
        </View> }
    </ScrollView>
}

export default ViewResource