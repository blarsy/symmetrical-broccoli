import Images from "@/Images"
import { IMAGE_BORDER_RADIUS, imgSourceFromPublicId } from "@/lib/images"
import { Resource } from "@/lib/schema"
import { aboveMdWidth, hasMinWidth, percentOfWidth } from "@/lib/utils"
import React from "react"
import { Image, ImageStyle, StyleProp, TouchableOpacity } from "react-native"

interface Props {
    resource: Resource
}

const MainResourceImage = ({ resource }: Props) => {
    const size = aboveMdWidth() ? 350 :
        (hasMinWidth(450) ? 200 : percentOfWidth(30))
    return <ResourceImage size={size} resource={resource} />
}

export const SmallResourceImage = ({ resource }: Props) => {
    const size = aboveMdWidth() ? 200 :
        (hasMinWidth(450) ? 120 : 80)
    return <ResourceImage size={size} resource={resource} />
}

interface FlexResourceImageProps {
    resource: Resource
}

export const FlexResourceImage = ({ resource }: FlexResourceImageProps) => {
    const style: StyleProp<ImageStyle> = {
        borderRadius: IMAGE_BORDER_RADIUS,
    }
    if(resource.images && resource.images.length > 0 && resource.images[0].publicId) {
        const imgData = resource.images[0]
        return <Image source={imgSourceFromPublicId(imgData.publicId!)} style={{
            flex: 1,
            resizeMode: 'contain',
            aspectRatio: 1,
            ...style
        }} />
    }

    return <Images.Photos fill="#aaa" style={{
        flex: 1,
        height: '100%',
        resizeMode: 'contain',
        aspectRatio: 1,
        ...style
    }}/>
}

interface ResourceImageProps {
    resource: Resource
    size: number
    onPress?: () => void
}

export const ResourceImage = ({ resource, size, onPress }: ResourceImageProps) => {
    let image
    if(resource.images && resource.images.length > 0 && resource.images[0].publicId) {
        const imgData = resource.images[0]
        image = <Image source={imgSourceFromPublicId(imgData.publicId!)} style={{ width: size, height: size, borderRadius: IMAGE_BORDER_RADIUS }} />
    } else {
        image = <Image source={require('@/assets/img/placeholder.png')} style={{ width: size, height: size, borderRadius: IMAGE_BORDER_RADIUS }} />
    }
    if(!onPress) return image

    return <TouchableOpacity onPress={onPress}>
        {image}
    </TouchableOpacity>
}

export default MainResourceImage