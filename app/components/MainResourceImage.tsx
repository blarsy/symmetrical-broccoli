import { Resource } from "@/lib/schema"
import { hasMinWidth, imgUrl, isMdWidth } from "@/lib/settings"
import React from "react"
import { Image } from "react-native"

interface Props {
    resource: Resource
}

const MainResourceImage = ({ resource }: Props) => {
    const size = isMdWidth() ? 200 :
        (hasMinWidth(450) ? 120 : 70)
    if(resource.images && resource.images.length > 0) {
        const imgData = resource.images[0]
        return <Image source={{ uri: `${imgUrl}${imgData.path}` }} alt={imgData.title} style={{ width: size, height: size }} />
    }
    return <Image source={require('@/assets/img/placeholder.png')} style={{ width: size, height: size }} />
}

export default MainResourceImage