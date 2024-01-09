import { RouteProps, ScreenSize, aboveMdWidth, getScreenSize } from "@/lib/utils"
import React, { useState } from "react"
import { Chip, Modal, Portal, Text } from "react-native-paper"
import { Resource } from "@/lib/schema"
import { t } from "@/i18n"
import { Dimensions, Image, ScrollView, TouchableOpacity, View } from "react-native"
import dayjs from "dayjs"
import SwiperFlatList from "react-native-swiper-flatlist"
import PanZoomImage from "./PanZoomImage"
import { lightPrimaryColor } from "./layout/constants"
import { Props } from "react-native-paper/lib/typescript/components/Chip"
import { urlFromPublicId } from "@/lib/images"

interface ResourceViewFieldProps {
    title: string,
    children: JSX.Element,
    titleOnOwnLine?: boolean
}

interface ImgMetadata { 
    source: string
    idx: number
}

const ResourceInfoChip = (p: Props) => <Chip style={{ backgroundColor: lightPrimaryColor, margin: 3 }} {...p}><Text variant="bodyMedium" style={{ textTransform: 'uppercase' }}>{p.children}</Text></Chip>

const ResourceViewField = ({ title, children, titleOnOwnLine }: ResourceViewFieldProps) => <View style={{ 
        flexDirection: titleOnOwnLine ? "column": "row", gap: titleOnOwnLine ? 0: 10, alignItems: titleOnOwnLine ?  'flex-start' : 'center', borderBottomColor: '#000', borderBottomWidth: 1
    }}>
    <Text variant="titleMedium" style={{ flexGrow: titleOnOwnLine ? 1: 0, flexShrink: titleOnOwnLine ? 1: 0, flexBasis: titleOnOwnLine ? 'auto' : '40%' }}>{title}</Text>
    {children}
</View>

const ImagesViewer = ({ resource, onImagePress }: { resource: Resource, onImagePress: (imgSource: string) => void}) => {
    const windowDimension = Dimensions.get('window')
    const hasOnlyOneImage = resource.images && resource.images.length === 1
    const smallestDimension = Math.min(windowDimension.height, windowDimension.width)
    const absoluteMaxImgSize = aboveMdWidth() ?
        getScreenSize() === ScreenSize.lg ? 500 : 400
        : 300
    let imgSize: number
    if(hasOnlyOneImage) {
        imgSize = Math.min( absoluteMaxImgSize, smallestDimension)
    } else {
        imgSize = Math.min( absoluteMaxImgSize, smallestDimension * 70 / 100)
    }

    if(hasOnlyOneImage) {
        return <TouchableOpacity style={{ height: imgSize, flexGrow: 1 }} onPress={() => onImagePress(urlFromPublicId(resource.images[0].publicId!))}>
            <Image style={{ flexGrow: 1 }} source={{ uri: urlFromPublicId(resource.images[0].publicId!)} }
                width={imgSize} height={imgSize} /> 
        </TouchableOpacity>
    }

    return <View style={{ flex: 1, flexDirection: 'column', marginBottom: 10 }}>
        <SwiperFlatList data={getSwiperData(resource)} 
            renderItem= {({ item }: { item: ImgMetadata }) => <TouchableOpacity onPress={() => onImagePress(item.source)}>
                <Image key={item.idx} source={{ uri: item.source}} width={imgSize} height={imgSize} 
                    style={{ width: imgSize, height: imgSize }} />
        </TouchableOpacity>} />
    </View>
}

const getSwiperData = (resource: Resource): ImgMetadata[] => {
    if(resource.images && resource.images.length > 0) {
        return resource.images.map((img, idx) => ({
            source: urlFromPublicId(img.publicId!),
            idx
        }))
    } else {
        return [{ source: '/placeholder.png', idx: 0}]
    }
}

const ViewResource = ({ route, navigation }:RouteProps) => {
    const resource = route.params.resource as Resource
    const [ focusedImage, setFocusedImage] = useState('')
    
    let expiration: { text: string, date: string }
    if(resource.expiration) {
        const dateObj = dayjs(resource.expiration)
        expiration = { text: dateObj.fromNow(), date: dateObj.format(t('dateFormat'))}
    } else {
        expiration = { text: '', date: ''}
    }
    
    return <ScrollView  style={{ flex: 1, flexDirection: 'column', padding: 10, backgroundColor: '#fff'}}>
        { resource.images && resource.images.length > 0 && <ImagesViewer onImagePress={setFocusedImage} resource={resource} /> }
        <ResourceViewField title={t('brought_by_label')}>
            <Text variant="bodyMedium">{resource.account?.name}</Text>
        </ResourceViewField>
        <ResourceViewField title={t('title_label')}>
            <Text variant="bodyMedium" style={{ textTransform: 'uppercase' }}>{resource.title}</Text>
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
        { expiration && <View>
            <ResourceViewField title={t('expiration_label')}>
                <View style={{ flexDirection: 'column' }}>
                    <Text variant="bodyMedium">{expiration.text}</Text>
                    <Text variant="bodyMedium">{expiration.date}</Text>
                </View>
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