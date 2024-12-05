import React, { ReactNode, useContext, useRef, useState } from "react"
import { Dimensions, Image, TouchableOpacity, View } from "react-native"
import { lightPrimaryColor, primaryColor } from "../layout/constants"
import { ActivityIndicator, Icon, IconButton, Portal, Text } from "react-native-paper"
import Icons from "@expo/vector-icons/FontAwesome"
import { t } from "@/i18n"
import Images from "@/Images"
import { ImageInfo } from "@/lib/schema"
import { urlFromPublicId } from "@/lib/images"
import { pickImage } from "@/lib/utils"
import { AppDispatchContext, AppReducerActionType } from "../AppContextProvider"
import { Camera } from "expo-camera"
import Slider from '@react-native-community/slider'

interface CameraButtonProps {
    children: ReactNode
    onDone: (imgUri: string) => void
}

const CameraButton = ({ children, onDone }: CameraButtonProps) => {
    const [permission, requestPermission] = Camera.useCameraPermissions()
    const [takingPicture, setTakingPicture] = useState(false)
    const [cameraReady, setCameraReady] = useState(false)
    const [processing, setProcessing] = useState(false)
    const [zoom, setZoom] = useState(0)
    const ref = useRef<Camera | null>(null)

    const picSize = Math.min(Dimensions.get('screen').width, Dimensions.get('screen').height)
    const vertical = Dimensions.get('screen').width < Dimensions.get('screen').height

    return <TouchableOpacity onPress={async () => {
        if(permission && !permission.granted){
            const perm = await requestPermission()
            if(perm.granted) {
                setTakingPicture(true)
            }
        } else {
            setTakingPicture(true)
        }
    }}>
        { children }
        { takingPicture && <Portal>
            <View style={{ width: Dimensions.get('screen').width, height: Dimensions.get('screen').height, 
                backgroundColor: lightPrimaryColor, justifyContent: 'center', alignItems: 'center',
                flexDirection: vertical ? 'column' : 'row', gap: 20 }}>
                <IconButton icon={p => <Images.Cross/>} onPress={ () => setTakingPicture(false)}/>
                <Camera ref={ref} zoom={zoom} style={{ width: picSize, height: picSize, justifyContent: processing ? 'space-between' : 'flex-end', alignItems: 'center', padding: 10, gap: 5 }} onCameraReady={() => setCameraReady(true)}>
                    { processing && <ActivityIndicator color={primaryColor} style={{ backgroundColor: '#000', borderRadius: 25 }} /> }
                    <View style={{ flexDirection: 'row' }}>
                        <Icon color="#fff" size={20} source="magnify"/>
                        <Slider thumbTintColor={primaryColor} maximumTrackTintColor={lightPrimaryColor} minimumTrackTintColor={lightPrimaryColor}
                            onValueChange={val => setZoom(val / 100)} minimumValue={0} value={zoom * 100}
                            maximumValue={100} style={{ width: '70%' }} />
                    </View>
                </Camera>
                <IconButton style={{ borderRadius: 3 }} disabled={!cameraReady} icon={Images.Camera} onPress={async () => {
                    setProcessing(true)
                    try {
                        const img = await ref.current?.takePictureAsync({ skipProcessing: true })
                        await ref.current?.pausePreview()
                        setTakingPicture(false)
                        if(img) {
                            onDone(img?.uri)
                        }
                    } finally {
                        setProcessing(false)
                    }
                }} />
            </View>
        </Portal>}
    </TouchableOpacity>
}

interface Props {
    images: ImageInfo[]
    onImageSelected: (img: ImageInfo) => void
    onImageDeleteRequested: (img: ImageInfo) => Promise<void>
}

const PicturesField = ({ images, onImageSelected, onImageDeleteRequested }: Props) => {
    const appDispatch = useContext(AppDispatchContext)

    const addPicture = (uri: string) => {
        try {
            onImageSelected({ 
                path: uri
            })
        } catch (e) {
            appDispatch({ type: AppReducerActionType.DisplayNotification, payload: { error: e as Error}})
        }
    }

    return <View style={{ flex: 1, alignItems: 'stretch', flexDirection: 'column' }}>
        { images && images.length > 0 &&
            <View style={{ flexDirection: 'row', gap: 5, flexWrap: 'wrap' }}>
                { images.map((image, idx) => {
                    return <View key={idx} style={{ flexDirection:'column', alignItems: 'center' }}>
                        <Image style={{ height: 100, width: 100 }} source={{ uri: image.path || urlFromPublicId(image.publicId!) }} />
                        <IconButton size={20} icon={p => <Images.Cross fill={p.color} />} iconColor={primaryColor} onPress={() => onImageDeleteRequested(image)}/>
                    </View>
                })}
            </View>
        }
        <View style={{ flex: 1, flexDirection: 'row', backgroundColor: lightPrimaryColor, borderRadius: 25, alignItems: 'stretch', justifyContent: 'space-around', padding: 15 }}>
            <CameraButton onDone={addPicture}>
                <View style={{ flexDirection: 'row', flex: 1, alignContent: 'center', justifyContent: 'space-around' }}>
                    <View style={{ flexDirection: 'column', alignItems: 'center' }}>
                        <Images.Camera style={{ height: 80, width: 100, marginBottom: 25, marginTop: 10 }} fill="#fff" />
                        <Text variant="titleMedium" style={{ color: primaryColor }}>
                            <Icons name="plus" style={{ padding: 5 }} />
                            {t('takePicture_Button')}
                        </Text>
                    </View>
                </View>
            </CameraButton>
            <View style={{ width: 5, backgroundColor: '#fff' }} />
            <TouchableOpacity onPress={async () => {
                pickImage(img => {
                    addPicture(img.uri)
                }, 400)
            }}>
                <View style={{ flexDirection: 'column', alignItems: 'center' }}>
                    <Images.Photos style={{ height: 100, width: 100, marginBottom: 15 }} fill="#fff" />
                    <Text variant="titleMedium" style={{ color: primaryColor }}>
                        <Icons name="plus" style={{ padding: 5 }} />
                        {t('addPictures_Button')}
                    </Text>
                </View>
            </TouchableOpacity>
        </View>
    </View>
}

export default PicturesField