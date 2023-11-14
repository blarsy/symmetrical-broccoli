import { RouteProps } from "@/lib/utils"
import React, { useState } from "react"
import { Chip, Modal, Portal, Text } from "react-native-paper"
import { imgUrl } from "@/lib/settings"
import { Resource } from "@/lib/schema"
import { t } from "@/i18n"
import { Dimensions, Image, ScrollView, TouchableOpacity, View } from "react-native"
import dayjs from "dayjs"
import SwiperFlatList from "react-native-swiper-flatlist"
import PanZoomImage from "./PanZoomImage"

interface ResourceViewFieldProps {
    title: string,
    children: JSX.Element,
    titleOnOwnLine?: boolean
}

interface ImgMetadata { 
    source: string
    alt: string
    idx: number
}

const ResourceViewField = ({ title, children, titleOnOwnLine }: ResourceViewFieldProps) => <View style={{ 
        flexDirection: titleOnOwnLine ? "column": "row", gap: titleOnOwnLine ? 0: 10, alignItems: titleOnOwnLine ?  'flex-start' : 'center', borderBottomColor: '#000', borderBottomWidth: 1
    }}>
    <Text variant="titleMedium">{title}</Text>
    {children}
</View>

const getSwiperData = (resource: Resource): ImgMetadata[] => {
    if(resource.images && resource.images.length > 0) {
        return resource.images.map((img, idx) => ({
            source: `${imgUrl}${img.path}`,
            alt: img.title,
            idx
        }))
    } else {
        return [{ source: '/placeholder.png', alt: 'placeholder', idx: 0}]
    }
}

const ViewResource = ({ route, navigation }:RouteProps) => {
    const resource = route.params.resource as Resource
    const [ focusedImage, setFocusedImage] = useState('')
    
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
        { resource.images && resource.images.length >0 && <View style={{ flex: 1, flexDirection: 'row', alignSelf: resource.images && resource.images.length === 1 ? 'center': 'auto', marginBottom: 10 }}>
            <SwiperFlatList data={getSwiperData(resource)} 
                renderItem= {({ item }: { item: ImgMetadata }) => <TouchableOpacity onPress={() => {
                    setFocusedImage(item.source)
                }}>
                    <Image key={item.idx} source={{ uri: item.source}} alt={item.alt} width={imgSize} height={imgSize} 
                        style={{ width: imgSize, height: imgSize }} />
            </TouchableOpacity>} />
        </View> }
        <ResourceViewField title={t('title_label')}>
            <Text variant="bodyLarge" style={{ textTransform: 'uppercase' }}>{resource.title}</Text>
        </ResourceViewField>
        <ResourceViewField title={t('description_label')} titleOnOwnLine>
            <Text variant="bodyMedium">{resource.description}</Text>
        </ResourceViewField>
        { expirationText && <View>
            <ResourceViewField title={t('expiration_label')}>
                <Text variant="bodyMedium">{expirationText}</Text>
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
                <View style={{ flexDirection: 'column', alignSelf: 'stretch' }}>
                    { resource.conditions.map((condition, idx) => <View key={idx} style={{ paddingBottom: 5, borderTopWidth: 1, borderTopColor: '#aaa' }}>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <Text variant="titleSmall" style={{ flexBasis: '30%', flexShrink: 0, flexGrow: 1 }}>{t('title_label')}</Text>
                            <Text variant="bodySmall" style={{ flexBasis: '70%', flexShrink: 0, flexGrow: 1 }}>{condition.title}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <Text variant="titleSmall" style={{ flexBasis: '30%', flexShrink: 0, flexGrow: 1 }}>{t('description_label')}</Text>
                            <Text variant="bodySmall" style={{ flexBasis: '70%', flexShrink: 0, flexGrow: 1 }}>{condition.description}</Text>
                        </View>
                    </View>)}
                </View>
            </ResourceViewField>
        </View> }
        <Portal>
            <Modal dismissable onDismiss={() => setFocusedImage('')} visible={ !!focusedImage }>
                { focusedImage && <PanZoomImage uri={focusedImage} /> }
            </Modal>
        </Portal>
    </ScrollView>
}

export default ViewResource