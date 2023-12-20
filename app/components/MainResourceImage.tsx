import { Resource } from "@/lib/schema"
import { imgUrl } from "@/lib/settings"
import { aboveMdWidth, hasMinWidth, percentOfWidth } from "@/lib/utils"
import React from "react"
import { Image } from "react-native"

interface Props {
    resource: Resource
}

const IMAGE_BORDER_RADIUS = 15

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

interface ResourceImageProps {
    resource: Resource
    size: number
}

export const ResourceImage = ({ resource, size }: ResourceImageProps) => {
    if(resource.images && resource.images.length > 0) {
        const imgData = resource.images[0]
        return <Image source={{ uri: `${imgUrl}${imgData.path}` }} alt={imgData.title} style={{ width: size, height: size, borderRadius: IMAGE_BORDER_RADIUS }} />
    }
    return <Image source={require('@/assets/img/placeholder.png')} style={{ width: size, height: size, borderRadius: IMAGE_BORDER_RADIUS }} />
}

export default MainResourceImage