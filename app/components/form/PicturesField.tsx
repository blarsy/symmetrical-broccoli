import React, { useContext } from "react"
import { Image, TouchableOpacity, View } from "react-native"
import { lightPrimaryColor, primaryColor } from "../layout/constants"
import { IconButton, Text } from "react-native-paper"
import Icons from "@expo/vector-icons/FontAwesome"
import { t } from "@/i18n"
import Images from "@/Images"
import { imgUrl } from "@/lib/settings"
import { ImagePickerAsset, launchImageLibraryAsync, MediaTypeOptions } from 'expo-image-picker'
import { NewOrExistingImage } from "../EditResourceContextProvider"
import { AppContext } from "../AppContextProvider"

interface Props {
    images: NewOrExistingImage[]
    onImageSelected: (img: NewOrExistingImage) => void
    onImageDeleteRequested: (img: NewOrExistingImage) => Promise<void>
}

const assetToString = (asset: ImagePickerAsset) => `name: ${asset.fileName}, size: ${asset.fileSize}, height : ${asset.height}, width : ${asset.width}`

const PicturesField = ({ images, onImageSelected, onImageDeleteRequested }: Props) => {
    const appContext = useContext(AppContext)
    return <View style={{ flex: 1, alignItems: 'stretch', flexDirection: 'column' }}>
        <View style={{ flexDirection: 'row', gap: 5, flexWrap: 'wrap' }}>
            { images.map((image, idx) => <View key={idx} style={{ flexDirection:'column', alignItems: 'center' }}>
                <Image style={{ height: 100, width: 100 }} source={{ uri: image.blob ? image.path : `${imgUrl}${image.path}` }} />
                <IconButton size={20} icon="close-thick" iconColor="red" onPress={() => onImageDeleteRequested(image)}/>
            </View>)}
        </View>
        <TouchableOpacity onPress={async () => {
                let result = await launchImageLibraryAsync({
                    mediaTypes: MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 1,
                })
                // appContext.actions.setMessage((result.assets && result.assets?.length > 0) ? assetToString(result.assets[0]): 'no asset')
                if(!result.canceled && result.assets.length > 0) {
                    const imgRes = await fetch(result.assets[0].uri)
                    const imgBlob = await imgRes.blob()
                    onImageSelected({ 
                        path: result.assets[0].uri, 
                        blob: imgBlob, 
                        size: result.assets[0].fileSize!, 
                        mimetype: 'image/jpeg',//result.assets[0].type,
                        title: result.assets[0].fileName || '' })
                }
        }}>
            <View style={{ flex: 1, backgroundColor: lightPrimaryColor, borderRadius: 25, alignItems: 'center', justifyContent: 'center', padding: 15 }}>
                <Images.Photos style={{ height: 100, width: '100%', marginBottom: 15 }} fill="#fff" />
                <Text style={{ color: primaryColor, fontSize: 16, fontFamily: 'dk-magical-brush' }}>
                    <Icons name="plus" style={{ padding: 5 }} />
                    {t('addPictures_Button')}
                </Text>
            </View>
        </TouchableOpacity>
    </View>
}

export default PicturesField