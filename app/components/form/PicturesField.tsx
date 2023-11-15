import React, { useContext } from "react"
import { Image, TouchableOpacity, View } from "react-native"
import { lightPrimaryColor, primaryColor } from "../layout/constants"
import { IconButton, Text } from "react-native-paper"
import Icons from "@expo/vector-icons/FontAwesome"
import { t } from "@/i18n"
import Images from "@/Images"
import { imgUrl } from "@/lib/settings"
import { launchImageLibraryAsync, MediaTypeOptions, requestMediaLibraryPermissionsAsync } from 'expo-image-picker'
import { manipulateAsync } from 'expo-image-manipulator'
import { NewOrExistingImage } from "../EditResourceContextProvider"
import { AppContext } from "../AppContextProvider"

interface Props {
    images: NewOrExistingImage[]
    onImageSelected: (img: NewOrExistingImage) => void
    onImageDeleteRequested: (img: NewOrExistingImage) => Promise<void>
}

const PicturesField = ({ images, onImageSelected, onImageDeleteRequested }: Props) => {
    const appContext = useContext(AppContext)
    return <View style={{ flex: 1, alignItems: 'stretch', flexDirection: 'column' }}>
        { images && images.length > 0 &&
            <View style={{ flexDirection: 'row', gap: 5, flexWrap: 'wrap' }}>
                { images.map((image, idx) => <View key={idx} style={{ flexDirection:'column', alignItems: 'center' }}>
                    <Image style={{ height: 100, width: 100 }} source={{ uri: image.blob ? image.path : `${imgUrl}${image.path}` }} />
                    <IconButton size={20} icon="close-thick" iconColor="red" onPress={() => onImageDeleteRequested(image)}/>
                </View>)}
            </View>
        }
        <TouchableOpacity onPress={async () => {
            try {
                await requestMediaLibraryPermissionsAsync(true)
                let result = await launchImageLibraryAsync({
                    mediaTypes: MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 1,
                })
                
                if(!result.canceled && result.assets.length > 0) {
                    const img = await manipulateAsync(result.assets[0].uri, [{ resize: { height: 400 }}])

                    const imgRes = await fetch(img.uri)
                    const imgBlob = await imgRes.blob()

                    onImageSelected({ 
                        path: img.uri, 
                        blob: imgBlob, 
                        size: imgBlob.size, 
                        mimetype: '',
                        title: result.assets[0].fileName || '' })
                }
            } catch(e) {
                appContext.actions.setMessage((e as Error).stack!)
                appContext.actions.notify(t('requestError'))
            }
        }}>
            <View style={{ flex: 1, backgroundColor: lightPrimaryColor, borderRadius: 25, alignItems: 'center', justifyContent: 'center', padding: 15 }}>
                <Images.Photos style={{ height: 100, width: '100%', marginBottom: 15 }} fill="#fff" />
                <Text variant="titleMedium" style={{ color: primaryColor }}>
                    <Icons name="plus" style={{ padding: 5 }} />
                    {t('addPictures_Button')}
                </Text>
            </View>
        </TouchableOpacity>
    </View>
}

export default PicturesField