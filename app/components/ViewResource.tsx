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
import { lightPrimaryColor, primaryColor } from "./layout/constants"
import { Props } from "react-native-paper/lib/typescript/components/Chip"

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

const ResourceInfoChip = (p: Props) => <Chip style={{ backgroundColor: primaryColor, margin: 3 }} {...p}><Text variant="bodyMedium" style={{ textTransform: 'uppercase' }}>{p.children}</Text></Chip>

const ResourceViewField = ({ title, children, titleOnOwnLine }: ResourceViewFieldProps) => <View style={{ 
        flexDirection: titleOnOwnLine ? "column": "row", gap: titleOnOwnLine ? 0: 10, alignItems: titleOnOwnLine ?  'flex-start' : 'center', borderBottomColor: '#000', borderBottomWidth: 1
    }}>
    <Text variant="titleMedium" style={{ flexGrow: titleOnOwnLine ? 'auto': 0, flexShrink: titleOnOwnLine ? 'auto': 0, flexBasis: titleOnOwnLine ? 'auto' : '40%' }}>{title}</Text>
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
    const hasOnlyOneImage = resource.images && resource.images.length === 1
    
    return <ScrollView  style={{ flex: 1, flexDirection: 'column', padding: 10, backgroundColor: '#fff'}}>
        { resource.images && resource.images.length >0 && <View style={{ flex: 1, flexDirection: 'column', marginBottom: 10, alignItems: hasOnlyOneImage ? 'center': 'flex-start' }}>
            <SwiperFlatList data={getSwiperData(resource)} 
                renderItem= {({ item }: { item: ImgMetadata }) => <TouchableOpacity onPress={() => {
                    setFocusedImage(item.source)
                }}>
                    <Image key={item.idx} source={{ uri: item.source}} alt={item.alt} width={imgSize} height={imgSize} 
                        style={{ width: imgSize, height: imgSize }} />
            </TouchableOpacity>} />
        </View> }
        <ResourceViewField title={t('brought_by_label')}>
            <Text variant="bodyLarge">{resource.account?.name}</Text>
        </ResourceViewField>
        <ResourceViewField title={t('title_label')}>
            <Text variant="bodyLarge" style={{ textTransform: 'uppercase' }}>{resource.title}</Text>
        </ResourceViewField>
        <ResourceViewField title={t('description_label')} titleOnOwnLine>
            <Text variant="bodyMedium">{resource.description}</Text>
        </ResourceViewField>
        <ResourceViewField title={t('nature_label')} titleOnOwnLine>
            <View style={{ flexDirection: 'row', gap: 1 }}>
                { resource.isProduct && <ResourceInfoChip>{t('isProduct_label')}</ResourceInfoChip>}
                { resource.isService && <ResourceInfoChip>{t('isService_label')}</ResourceInfoChip>}
            </View>
        </ResourceViewField>
        { expirationText && <View>
            <ResourceViewField title={t('expiration_label')}>
                <Text variant="bodyMedium">{expirationText}</Text>
            </ResourceViewField>
        </View>}
        { resource.categories && resource.categories.length > 0 && 
            <ResourceViewField title={t('resourceCategories_label')} titleOnOwnLine>
                <View style={{ flexDirection: "row", gap: 3, flexWrap: 'wrap' }}>
                    { resource.categories.map((cat, idx) => <ResourceInfoChip key={idx}>{cat.name}</ResourceInfoChip>) }
                </View>
            </ResourceViewField>
        }
        { resource.isProduct && <ResourceViewField title={t('transport_label')} titleOnOwnLine>
            <View style={{ flexDirection: 'row', gap: 1 }}>
                { resource.canBeTakenAway && <ResourceInfoChip>{t('canBeTakenAway_label')}</ResourceInfoChip>}
                { resource.canBeDelivered && <ResourceInfoChip>{t('canBeDelivered_label')}</ResourceInfoChip>}
            </View>
        </ResourceViewField> }
        <ResourceViewField title={t('type_label')} titleOnOwnLine>
            <View style={{ flexDirection: 'row', gap: 1 }}>
                { resource.canBeGifted && <ResourceInfoChip>{t('canBeGifted_label')}</ResourceInfoChip>}
                { resource.canBeExchanged && <ResourceInfoChip>{t('canBeExchanged_label')}</ResourceInfoChip>}
            </View>
        </ResourceViewField>
        <Portal>
            <Modal dismissable onDismiss={() => setFocusedImage('')} visible={ !!focusedImage }>
                { focusedImage && <PanZoomImage uri={focusedImage} /> }
            </Modal>
        </Portal>
    </ScrollView>
}

export default ViewResource