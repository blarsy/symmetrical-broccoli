import { GET_RESOURCE, RouteProps, ScreenSize, aboveMdWidth, adaptToWidth, fontSizeMedium, getScreenSize, regionFromLocation } from "@/lib/utils"
import React, { useContext, useState } from "react"
import { Banner, Button, Chip, Icon, IconButton, Text } from "react-native-paper"
import { Resource, fromServerGraphResource, parseLocationFromGraph } from "@/lib/schema"
import { t } from "@/i18n"
import { Dimensions, Image, ImageSourcePropType, ScrollView, TouchableOpacity, View } from "react-native"
import dayjs from "dayjs"
import SwiperFlatList from "react-native-swiper-flatlist"
import PanZoomImage from "../PanZoomImage"
import { lightPrimaryColor, primaryColor } from "../layout/constants"
import { IMAGE_BORDER_RADIUS, imgSourceFromPublicId } from "@/lib/images"
import { useQuery } from "@apollo/client"
import LoadedZone from "../LoadedZone"
import ViewField from "../ViewField"
import { AppContext } from "../AppContextProvider"
import Images from "@/Images"
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps"
import useUserConnectionFunctions from "@/lib/useUserConnectionFunctions"
import { EditResourceContext } from "./EditResourceContextProvider"
import BareIconButton from "../layout/BareIconButton"
import { Hr } from "../layout/lib"

interface ImgMetadata { 
    source: ImageSourcePropType
    idx: number
}

const ResourceInfoChip = (p: any) => <Chip style={{ backgroundColor: lightPrimaryColor, margin: 3 }} {...p}><Text variant="bodyMedium" style={{ textTransform: 'uppercase' }}>{p.children}</Text></Chip>

const ImagesViewer = ({ resource, onImagePress }: { resource: Resource, onImagePress: (imgSource: ImageSourcePropType) => void}) => {
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
        return <TouchableOpacity style={{ height: imgSize, flexGrow: 1, alignItems: 'center', marginBottom: 10 }} onPress={() => onImagePress(imgSourceFromPublicId(resource.images[0].publicId!))}>
            <Image style={{ flexGrow: 1, borderRadius: IMAGE_BORDER_RADIUS }} source={imgSourceFromPublicId(resource.images[0].publicId!)}
                width={imgSize} height={imgSize} />
        </TouchableOpacity>
    }

    return <View style={{ flex: 1, flexGrow: 1, alignItems: 'center', flexDirection:"row", marginBottom: 10 }}>
        <View style={{ flexBasis: '50%', flexShrink: 1, alignItems: 'center' }}></View>
        <SwiperFlatList style={{ width: imgSize, flexGrow: 0, flexShrink: 0 }} data={getSwiperData(resource)} onEndReached={() => setSwipedToEnd(true)} renderItem= {({ item }: { item: ImgMetadata }) => <TouchableOpacity onPress={() => onImagePress(item.source)}>
            <Image key={item.idx} source={item.source} width={imgSize} height={imgSize} style={{ borderRadius: IMAGE_BORDER_RADIUS }} />
        </TouchableOpacity>} />
        <View style={{ flexBasis: '50%', flexShrink: 1, alignItems: 'center' }}>{ !swipedToEnd && <Icon source="gesture-swipe-right" size={40}/>}</View>
    </View>
}

const getSwiperData = (resource: Resource): ImgMetadata[] => {
    if(resource.images && resource.images.length > 0) {
        return resource.images.map((img, idx) => ({
            source: imgSourceFromPublicId(img.publicId || ''),
            idx
        }))
    } else {
        return [{ source: require('@/assets/img/placeholder.png'), idx: 0}]
    }
}

const ViewResource = ({ route, navigation }:RouteProps) => {
    const appState = useContext(AppContext)
    const editResourceContext = useContext(EditResourceContext)
    const { data, loading, error } = useQuery(GET_RESOURCE, { variables: { id: new Number(route.params.resourceId) }})
    const [ focusedImage, setFocusedImage] = useState<ImageSourcePropType | undefined>(undefined)
    const { ensureConnected } = useUserConnectionFunctions()

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
    return <ScrollView style={{ flex: 1, flexDirection: 'column', padding: 10, backgroundColor: '#fff' }}>
        <LoadedZone loading={loading} error={error} containerStyle={{ marginBottom: 15 }}>
        { resource && <>
            { resource.deleted && <Banner elevation={0} style={{ backgroundColor: lightPrimaryColor, marginBottom: 15, borderRadius: IMAGE_BORDER_RADIUS }} icon={p => <Icon size={25} source="trash-can" />} visible={true}>
                <Text variant="bodySmall">{t('resource_deleted', { deleted: dayjs(resource.deleted).format(t('dateFormat')) })}</Text>
            </Banner> }
            { !resource.deleted && resource.expiration && new Date(resource.expiration) < new Date() && <Banner elevation={0} style={{ backgroundColor: lightPrimaryColor, marginBottom: 15, borderRadius: IMAGE_BORDER_RADIUS }} icon={p => <Icon size={25} source="timer-off-outline" />} visible={true}>
                <Text variant="bodySmall">{t('resource_expired', { expired: dayjs(resource.expiration).format(t('dateFormat')) })}</Text>
            </Banner>}
            { resource.images && resource.images.length > 0 && 
                <ImagesViewer onImagePress={setFocusedImage} resource={resource} /> }
            <View style={{ flexDirection: 'row' }}>
                <ViewField style={{ flex: 1 }} title={t('brought_by_label')} titleOnOwnLine>
                    <View style={{ flexDirection: 'row', flex: 1, alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flex: 1, alignContent: 'flex-start', justifyContent: 'flex-start' }}>
                            <TouchableOpacity onPress={() => navigation.navigate('viewAccount', { id: resource.account?.id })}>
                                <Text variant="bodyMedium" style={{ textDecorationLine: 'underline', fontFamily: 'Futura-std-heavy', color: primaryColor }}>{resource.account?.name}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ViewField>
                { resource.account?.id === appState.account?.id && <BareIconButton size={35} onPress={() => {
                    ensureConnected('introduce_yourself', '', () => {
                        setTimeout(() => navigation.navigate('chat', {
                            screen: 'conversation',
                            params: {
                                resourceId: resource.id,
                                otherAccountId: resource.account?.id 
                            }
                        }))
                    })
                } } Image={Images.Chat} />}
            </View>
            <Hr thickness={2}/>
            <View style={{ flexDirection: 'row' }}>
                <ViewField style={{ flex: 1 }} title={t('title_label')} titleOnOwnLine>
                    <View style={{ flexDirection: 'row', alignContent: 'stretch', justifyContent: 'center' }}>
                        <Text style={{ flex: 1 }} variant="bodyMedium">{resource.title}</Text>
                    </View>
                </ViewField>
                { appState.account && resource.account!.id === appState.account!.id && <BareIconButton Image={Images.Modify} size={35} onPress={() => {
                    editResourceContext.actions.setResource(resource)
                    navigation.goBack()
                    navigation.navigate('editResource')
                }}/>}
            </View>
            <Hr thickness={2}/>
            <ViewField title={t('description_label')} titleOnOwnLine>
                <Text variant="bodyMedium">{resource.description}</Text>
            </ViewField>
            <Hr thickness={2}/>
            <ViewField title={t('nature_label')} titleOnOwnLine>
                <View style={{ flexDirection: 'row', gap: 1 }}>
                    { resource.isProduct && <ResourceInfoChip>{t('isProduct_label')}</ResourceInfoChip>}
                    { resource.isService && <ResourceInfoChip>{t('isService_label')}</ResourceInfoChip>}
                </View>
            </ViewField>
            <Hr thickness={2}/>
            { expiration && <View>
                <ViewField title={t('expiration_label')}>
                    <View style={{ flexDirection: 'column' }}>
                        <Text variant="bodyMedium">{expiration.text}</Text>
                        <Text variant="bodyMedium">{expiration.date}</Text>
                    </View>
                </ViewField>
                <Hr thickness={2}/>
            </View>}
            { resource.categories && resource.categories.length > 0 && <>
                <ViewField title={t('resourceCategories_label')} titleOnOwnLine>
                    <View style={{ flexDirection: "row", gap: 3, flexWrap: 'wrap' }}>
                        { resource.categories.map((cat, idx) => <ResourceInfoChip key={idx}>{cat.name}</ResourceInfoChip>) }
                    </View>
                </ViewField>
                <Hr thickness={2}/>
            </> }
            { resource.isProduct && <>
                <ViewField title={t('transport_label')} titleOnOwnLine>
                    <View style={{ flexDirection: 'row', gap: 1 }}>
                        { resource.canBeTakenAway && <ResourceInfoChip>{t('canBeTakenAway_label')}</ResourceInfoChip>}
                        { resource.canBeDelivered && <ResourceInfoChip>{t('canBeDelivered_label')}</ResourceInfoChip>}
                    </View>
                </ViewField>
                <Hr thickness={2}/>
            </> }
            <ViewField title={t('type_label')} titleOnOwnLine>
                <View style={{ flexDirection: 'row', gap: 1 }}>
                    { resource.canBeGifted && <ResourceInfoChip>{t('canBeGifted_label')}</ResourceInfoChip>}
                    { resource.canBeExchanged && <ResourceInfoChip>{t('canBeExchanged_label')}</ResourceInfoChip>}
                </View>
            </ViewField>
            <Hr thickness={2}/>
            <ViewField title={t('address_label')} titleOnOwnLine>
                <View style={{ flexDirection: 'column' }}>
                    <Text variant="bodySmall" style={{ paddingVertical: 5 }}>{resource.specificLocation?.address || t('no_address_defined')}</Text>
                    { resource.specificLocation && <MapView showsUserLocation={false} style={{ height: adaptToWidth(200, 300, 550) }} 
                        region={regionFromLocation(parseLocationFromGraph(resource.specificLocation)!)}
                        provider={PROVIDER_GOOGLE}>
                        <Marker coordinate={parseLocationFromGraph(resource.specificLocation)!} />
                    </MapView> }
                </View>
            </ViewField>
            <PanZoomImage onDismess={() => setFocusedImage(undefined)} source={focusedImage} />
        </>}
        </LoadedZone>
    </ScrollView>
}

export default ViewResource