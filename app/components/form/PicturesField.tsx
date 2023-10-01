import { Image as ImageSchema } from "@/lib/schema"
import React from "react"
import { Image, TouchableOpacity, View } from "react-native"
import { lightPrimaryColor, primaryColor } from "../layout/constants"
import { Text } from "react-native-paper"
import Icons from "@expo/vector-icons/FontAwesome"
import { t } from "@/i18n"
import Images from "@/Images"
import { imgUrl } from "@/lib/settings"

interface Props {
    images: ImageSchema[]
}

const PicturesField = ({ images }: Props) => <View style={{ flex: 1, alignItems: 'stretch', flexDirection: 'column' }}>
    <View style={{ flexDirection: 'row', gap: 5, flexWrap: 'wrap' }}>
        { images.map((image, idx) => <Image key={idx} style={{ height: 100, width: 100 }} source={{ uri: `${imgUrl}${image.path}` }} />)}
    </View>
    <TouchableOpacity onPress={() => {}}>
        <View style={{ flex: 1, backgroundColor: lightPrimaryColor, borderRadius: 25, alignItems: 'center', justifyContent: 'center', padding: 15 }}>
            <Images.Photos style={{ height: 100, width: '100%', marginBottom: 15 }} fill="#fff" />
            <Text style={{ color: primaryColor, fontSize: 16, fontFamily: 'dk-magical-brush' }}>
                <Icons name="plus" style={{ padding: 5 }} />
                {t('addPictures_Button')}
            </Text>
        </View>
    </TouchableOpacity>
</View>

export default PicturesField