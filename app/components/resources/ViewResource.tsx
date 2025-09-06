import { GET_RESOURCE, RouteProps, ScreenSize, aboveMdWidth, adaptToWidth, getScreenSize, regionFromLocation } from "@/lib/utils"
import React, { useContext, useEffect, useState } from "react"
import { Banner, Chip, Icon, Text } from "react-native-paper"
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
import SendTokensDialog from "../account/SendTokensDialog"

interface ImgMetadata { 
    source: ImageSourcePropType
    idx: number
}

const ResourceInfoChip = (p: any) => <Chip testID={p.testID} style={{ backgroundColor: lightPrimaryColor, margin: 3 }} {...p}><Text variant="bodyMedium" style={{ textTransform: 'uppercase' }}>{p.children}</Text></Chip>

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
        <SwiperFlatList style={{ width: imgSize, flexGrow: 0, flexShrink: 0 }} 
            data={getSwiperData(resource)} onEndReached={() => setSwipedToEnd(true)} 
            renderItem= {({ item }: { item: ImgMetadata }) => <TouchableOpacity 
            onPress={() => onImagePress(item.source)}>
            <Image key={item.idx} source={item.source} width={imgSize} height={imgSize} 
                style={{ borderRadius: IMAGE_BORDER_RADIUS }} />
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
    const baseTestId = 'viewResource'
    const appState = useContext(AppContext)
    const editResourceContext = useContext(EditResourceContext)
    const { data, loading, error } = useQuery(GET_RESOURCE, { variables: { id: new Number(route.params.resourceId) }})
    const [resource, setResource] = useState<{ data: Resource, expirationInfo: { text: string, date: string } } | undefined>()
    const [ focusedImage, setFocusedImage] = useState<ImageSourcePropType | undefined>(undefined)
    const { ensureConnected } = useUserConnectionFunctions()
    const [sendingTokensTo, setSendingTokensTo] = useState<number | undefined>()

    let expiration: { text: string, date: string } | undefined = undefined
    
    useEffect(() => {
        if(data && appState.categories.data && appState.categories.data.length > 0) {
            const res = fromServerGraphResource(data.resourceById, appState.categories.data)
            if(res.expiration) {
                const dateObj = dayjs(res.expiration)
                expiration = { text: dateObj.fromNow(), date: dateObj.format(t('dateFormat'))}
            } else {
                expiration = { text: t('noDate'), date: ''}
            }
            setResource({ data: res, expirationInfo: expiration })
        }
    }, [data, appState.categories.data])
    
    return <ScrollView style={{ flex: 1, flexDirection: 'column', padding: 10, backgroundColor: '#fff' }}>
        <LoadedZone loading={loading} error={error} containerStyle={{ marginBottom: 15 }}>
        { resource && <>
            { resource.data.deleted && <Banner elevation={0} style={{ backgroundColor: lightPrimaryColor, marginBottom: 15, borderRadius: IMAGE_BORDER_RADIUS }} icon={p => <Icon size={25} source="trash-can" />} visible={true}>
                <Text variant="bodySmall">{t('resource_deleted', { deleted: dayjs(resource.data.deleted).format(t('dateFormat')) })}</Text>
            </Banner> }
            { !resource.data.deleted && resource.data.expiration && new Date(resource.data.expiration) < new Date() && <Banner elevation={0} style={{ backgroundColor: lightPrimaryColor, marginBottom: 15, borderRadius: IMAGE_BORDER_RADIUS }} icon={p => <Icon size={25} source="timer-off-outline" />} visible={true}>
                <Text variant="bodySmall">{t('resource_expired', { expired: dayjs(resource.data.expiration).format(t('dateFormat')) })}</Text>
            </Banner>}
            { resource.data.images && resource.data.images.length > 0 && 
                <ImagesViewer onImagePress={setFocusedImage} resource={resource.data} /> }
            <View style={{ flexDirection: 'row', gap: 5 }}>
                <ViewField style={{ flex: 1 }} title={t('brought_by_label')} titleOnOwnLine>
                    <View style={{ flexDirection: 'row', flex: 1, alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flex: 1, alignContent: 'flex-start', justifyContent: 'flex-start' }}>
                            <TouchableOpacity testID={`${baseTestId}:viewButton`} onPress={() => navigation.navigate('viewAccount', { id: resource.data.account?.id })}>
                                <Text variant="bodyMedium" style={{ textDecorationLine: 'underline', color: primaryColor }}>{resource.data.account?.name}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ViewField>
                { resource.data.account?.id != appState.account?.id && <BareIconButton size={35} onPress={() => {
                    ensureConnected('introduce_yourself', '', () => {
                        setTimeout(() => navigation.navigate('chat', {
                            screen: 'conversation',
                            params: {
                                resourceId: resource.data.id,
                                otherAccountId: resource.data.account?.id 
                            }
                        }))
                    })
                } } Image={Images.Chat} /> }
                { resource.data.account?.id != appState.account?.id && resource.data.account?.willingToContribute && appState.account?.willingToContribute &&
                    <BareIconButton testID={`${baseTestId}:SendTokens`} size={35} onPress={() => {
                        ensureConnected('introduce_yourself', '', () => {
                            setSendingTokensTo(resource.data.account!.id)
                        })
                    } } Image="hand-coin" />
                }
            </View>
            <Hr thickness={2}/>
            <View style={{ flexDirection: 'row' }}>
                <ViewField style={{ flex: 1 }} title={t('title_label')} titleOnOwnLine>
                    <View style={{ flexDirection: 'row', alignContent: 'stretch', justifyContent: 'center' }}>
                        <Text testID={`${baseTestId}:title`} style={{ flex: 1 }} variant="bodyMedium">{resource.data.title}</Text>
                    </View>
                </ViewField>
                { appState.account && resource.data.account!.id === appState.account!.id && <BareIconButton Image={Images.Modify} size={35} onPress={() => {
                    editResourceContext.actions.setResource(resource.data)
                    navigation.navigate('resource', {
                        screen: 'editResource'
                    })
                }}/>}
            </View>
            <Hr thickness={2}/>
            <ViewField title={t('description_label')} titleOnOwnLine>
                <Text testID={`${baseTestId}:description`} variant="bodyMedium">{resource.data.description}</Text>
            </ViewField>
            <Hr thickness={2}/>
            <ViewField title={t('nature_label')} titleOnOwnLine>
                <View style={{ flexDirection: 'row', gap: 1 }}>
                    { resource.data.isProduct && <ResourceInfoChip testID={`${baseTestId}:isProduct`}>{t('isProduct_label')}</ResourceInfoChip>}
                    { resource.data.isService && <ResourceInfoChip testID={`${baseTestId}:isService`}>{t('isService_label')}</ResourceInfoChip>}
                </View>
            </ViewField>
            <Hr thickness={2}/>
            { resource.expirationInfo && <View>
                <ViewField title={t('expiration_label')}>
                    <View style={{ flexDirection: 'column' }}>
                        <Text variant="bodyMedium">{resource.expirationInfo.text}</Text>
                        { resource.expirationInfo.date && <Text testID={`${baseTestId}:expiration`} variant="bodyMedium">{resource.expirationInfo.date}</Text> }
                    </View>
                </ViewField>
                <Hr thickness={2}/>
            </View>}
            {resource.data.subjectiveValue && <>
                <ViewField title={t('subjectiveValueLabel')}>
                    <View style={{ flexDirection: 'column' }}>
                        <Text variant="bodyMedium">{`${resource.data.subjectiveValue}€`}</Text>
                    </View>
                </ViewField>
                <Hr thickness={2}/>
            </>}
            { resource.data.categories && resource.data.categories.length > 0 && <>
                <ViewField title={t('resourceCategories_label')} titleOnOwnLine>
                    <View style={{ flexDirection: "row", gap: 3, flexWrap: 'wrap' }}>
                        { resource.data.categories.map((cat, idx) => <ResourceInfoChip testID={`${baseTestId}:CategoryChip:${cat.code}`} key={idx}>{cat.name}</ResourceInfoChip>) }
                    </View>
                </ViewField>
                <Hr thickness={2}/>
            </> }
            { resource.data.isProduct && <>
                <ViewField title={t('transport_label')} titleOnOwnLine>
                    <View style={{ flexDirection: 'row', gap: 1 }}>
                        { resource.data.canBeTakenAway && <ResourceInfoChip testID={`${baseTestId}:canBeTakenAway`}>{t('canBeTakenAway_label')}</ResourceInfoChip>}
                        { resource.data.canBeDelivered && <ResourceInfoChip testID={`${baseTestId}:canBeDelivered`}>{t('canBeDelivered_label')}</ResourceInfoChip>}
                    </View>
                </ViewField>
                <Hr thickness={2}/>
            </> }
            <ViewField title={t('type_label')} titleOnOwnLine>
                <View style={{ flexDirection: 'row', gap: 1 }}>
                    { resource.data.canBeGifted && <ResourceInfoChip testID={`${baseTestId}:canBeGifted`}>{t('canBeGifted_label')}</ResourceInfoChip>}
                    { resource.data.canBeExchanged && <ResourceInfoChip testID={`${baseTestId}:canBeExchanged`}>{t('canBeExchanged_label')}</ResourceInfoChip>}
                </View>
            </ViewField>
            <Hr thickness={2}/>
            <ViewField title={t('address_label')} titleOnOwnLine>
                <View style={{ flexDirection: 'column' }}>
                    <Text variant="bodySmall" style={{ paddingVertical: 5 }}>{resource.data.specificLocation?.address || t('no_address_defined')}</Text>
                    { resource.data.specificLocation && <MapView showsUserLocation={false} style={{ height: adaptToWidth(200, 300, 550) }} 
                        region={regionFromLocation(parseLocationFromGraph(resource.data.specificLocation)!)}
                        provider={PROVIDER_GOOGLE}>
                        <Marker coordinate={parseLocationFromGraph(resource.data.specificLocation)!} />
                    </MapView> }
                </View>
            </ViewField>
            <PanZoomImage onDismess={() => setFocusedImage(undefined)} source={focusedImage} />
            <SendTokensDialog toAccount={sendingTokensTo} accountName={resource.data.account!.name} 
                onDismiss={() => setSendingTokensTo(undefined)} testID="sendTokensDialog" />
        </>}
        </LoadedZone>
    </ScrollView>
}

export default ViewResource