import { GET_RESOURCE, RouteProps, ScreenSize, aboveMdWidth, getScreenSize } from "@/lib/utils"
import React, { useContext, useState } from "react"
import { Banner, Button, Chip, Icon, Modal, Portal, Text } from "react-native-paper"
import { Resource, fromServerGraphResource } from "@/lib/schema"
import { t } from "@/i18n"
import { Dimensions, Image, ScrollView, TouchableOpacity, View } from "react-native"
import dayjs from "dayjs"
import SwiperFlatList from "react-native-swiper-flatlist"
import PanZoomImage from "../PanZoomImage"
import { lightPrimaryColor } from "../layout/constants"
import { urlFromPublicId } from "@/lib/images"
import { useQuery } from "@apollo/client"
import LoadedZone from "../LoadedZone"
import ViewField from "../ViewField"
import { AppContext } from "../AppContextProvider"

interface ImgMetadata { 
    source: string
    idx: number
}

const ResourceInfoChip = (p: any) => <Chip style={{ backgroundColor: lightPrimaryColor, margin: 3 }} {...p}><Text variant="bodyMedium" style={{ textTransform: 'uppercase' }}>{p.children}</Text></Chip>

const ImagesViewer = ({ resource, onImagePress }: { resource: Resource, onImagePress: (imgSource: string) => void}) => {
    const [swipedToEnd, setSwipedToEnd] = useState(false)
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
        return <TouchableOpacity style={{ height: imgSize, flexGrow: 1, alignItems: 'center', marginBottom: 10 }} onPress={() => onImagePress(urlFromPublicId(resource.images[0].publicId!))}>
            <Image style={{ flexGrow: 1 }} source={{ uri: urlFromPublicId(resource.images[0].publicId!)} }
                width={imgSize} height={imgSize} /> 
        </TouchableOpacity>
    }

    return <View style={{ flex: 1, flexGrow: 1, alignItems: 'center', flexDirection:"row", marginBottom: 10 }}>
        <View style={{ flexBasis: '50%', flexShrink: 1, alignItems: 'center' }}></View>
        <SwiperFlatList style={{ width: imgSize, flexGrow: 0, flexShrink: 0 }} data={getSwiperData(resource)} onEndReached={() => setSwipedToEnd(true)} renderItem= {({ item }: { item: ImgMetadata }) => <TouchableOpacity onPress={() => onImagePress(item.source)}>
                <Image key={item.idx} source={{ uri: item.source}} width={imgSize} height={imgSize} />
        </TouchableOpacity>} />
        <View style={{ flexBasis: '50%', flexShrink: 1, alignItems: 'center' }}>{ !swipedToEnd && <Icon source="gesture-swipe-right" size={40}/>}</View>
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
    const appState = useContext(AppContext)
    const { data, loading, error } = useQuery(GET_RESOURCE, { variables: { id: route.params.resourceId }})
    const [ focusedImage, setFocusedImage] = useState('')
    

    let expiration: { text: string, date: string } | undefined = undefined
    let resource : Resource | undefined = undefined
    
    if(data && appState.categories.data && appState.categories.data.length > 0) {
        resource = fromServerGraphResource(data.resourceById, appState.categories.data)
        if(resource.expiration) {
            const dateObj = dayjs(resource.expiration)
            expiration = { text: dateObj.fromNow(), date: dateObj.format(t('dateFormat'))}
        } else {
            expiration = { text: '', date: ''}
        }
    }
    return <ScrollView style={{ flex: 1, flexDirection: 'column', padding: 10, backgroundColor: '#fff'}}>
        <LoadedZone loading={loading} error={error}>
        { resource && <>
            <Banner icon={p => <Icon size={20} source="trash-can" />} visible={!!resource.deleted}>
                {t('resource_deleted', { deleted: dayjs(resource.deleted).format(t('dateFormat')) })}
            </Banner>
            { resource.images && resource.images.length > 0 && 
                <ImagesViewer onImagePress={setFocusedImage} resource={resource} /> }
            <ViewField title={t('brought_by_label')}>
                <Button mode="text" icon={() => <Icon source="information" size={20} color="#000" />} ><Text variant="bodyMedium">{resource.account?.name}</Text></Button>
            </ViewField>
            <ViewField title={t('title_label')}>
                <Text variant="bodyMedium" style={{ textTransform: 'uppercase' }}>{resource.title}</Text>
            </ViewField>
            <ViewField title={t('description_label')} titleOnOwnLine>
                <Text variant="bodyMedium">{resource.description}</Text>
            </ViewField>
            <ViewField title={t('nature_label')} titleOnOwnLine>
                <View style={{ flexDirection: 'row', gap: 1 }}>
                    { resource.isProduct && <ResourceInfoChip>{t('isProduct_label')}</ResourceInfoChip>}
                    { resource.isService && <ResourceInfoChip>{t('isService_label')}</ResourceInfoChip>}
                </View>
            </ViewField>
            { expiration && <View>
                <ViewField title={t('expiration_label')}>
                    <View style={{ flexDirection: 'column' }}>
                        <Text variant="bodyMedium">{expiration.text}</Text>
                        <Text variant="bodyMedium">{expiration.date}</Text>
                    </View>
                </ViewField>
            </View>}
            { resource.categories && resource.categories.length > 0 && 
                <ViewField title={t('resourceCategories_label')} titleOnOwnLine>
                    <View style={{ flexDirection: "row", gap: 3, flexWrap: 'wrap' }}>
                        { resource.categories.map((cat, idx) => <ResourceInfoChip key={idx}>{cat.name}</ResourceInfoChip>) }
                    </View>
                </ViewField>
            }
            { resource.isProduct && <ViewField title={t('transport_label')} titleOnOwnLine>
                <View style={{ flexDirection: 'row', gap: 1 }}>
                    { resource.canBeTakenAway && <ResourceInfoChip>{t('canBeTakenAway_label')}</ResourceInfoChip>}
                    { resource.canBeDelivered && <ResourceInfoChip>{t('canBeDelivered_label')}</ResourceInfoChip>}
                </View>
            </ViewField> }
            <ViewField title={t('type_label')} titleOnOwnLine>
                <View style={{ flexDirection: 'row', gap: 1 }}>
                    { resource.canBeGifted && <ResourceInfoChip>{t('canBeGifted_label')}</ResourceInfoChip>}
                    { resource.canBeExchanged && <ResourceInfoChip>{t('canBeExchanged_label')}</ResourceInfoChip>}
                </View>
            </ViewField>
            <Portal>
                <Modal dismissable onDismiss={() => setFocusedImage('')} visible={ !!focusedImage }>
                    { focusedImage && <PanZoomImage uri={focusedImage} /> }
                </Modal>
            </Portal>
        </>}
        </LoadedZone>
    </ScrollView>
}

export default ViewResource