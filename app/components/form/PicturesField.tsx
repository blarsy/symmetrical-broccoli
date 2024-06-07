import React, { useContext } from "react"
import { Image, TouchableOpacity, View } from "react-native"
import { lightPrimaryColor, primaryColor } from "../layout/constants"
import { IconButton, Text } from "react-native-paper"
import Icons from "@expo/vector-icons/FontAwesome"
import { t } from "@/i18n"
import Images from "@/Images"
import { ImageInfo } from "@/lib/schema"
import { urlFromPublicId } from "@/lib/images"
import { pickImage } from "@/lib/utils"
import { AppDispatchContext, AppReducerActionType } from "../AppContextProvider"

interface Props {
    images: ImageInfo[]
    onImageSelected: (img: ImageInfo) => void
    onImageDeleteRequested: (img: ImageInfo) => Promise<void>
}

const PicturesField = ({ images, onImageSelected, onImageDeleteRequested }: Props) => {
    const appDispatch = useContext(AppDispatchContext)
    return <View style={{ flex: 1, alignItems: 'stretch', flexDirection: 'column' }}>
        { images && images.length > 0 &&
            <View style={{ flexDirection: 'row', gap: 5, flexWrap: 'wrap' }}>
                { images.map((image, idx) => {
                    return <View key={idx} style={{ flexDirection:'column', alignItems: 'center' }}>
                        <Image style={{ height: 100, width: 100 }} source={{ uri: image.path || urlFromPublicId(image.publicId!) }} />
                        <IconButton size={20} icon="close-thick" iconColor={primaryColor} onPress={() => onImageDeleteRequested(image)}/>
                    </View>
                })}
            </View>
        }
        <TouchableOpacity onPress={async () => {
            pickImage(img => {
                try {
                    onImageSelected({ 
                        path: img.uri
                    })
                } catch (e) {
                    appDispatch({ type: AppReducerActionType.DisplayNotification, payload: { error: e as Error}})
                }
            }, 400)
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