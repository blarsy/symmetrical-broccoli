import React from "react"
import { View } from "react-native"
import { ResourceImage } from "./resources/MainResourceImage"
import AccountAvatar, { AvatarIconAccountInfo } from "./mainViews/AccountAvatar"
import { Resource } from "@/lib/schema"

interface Props {
    resource: Resource
    authorInfo: AvatarIconAccountInfo
    size?: number
    onAccountPress: (id: number) => void
}

const ResourceImageWithCreator = ({resource, authorInfo, size, onAccountPress}: Props) => {
    const imageSize = (size || 50) / 60 * 50
    const containersize = size || 50
    return <View style={{ position: 'relative', width: containersize, height: containersize }}>
        <ResourceImage size={ imageSize } resource={resource} />
        <AccountAvatar style={{ position: 'absolute', top: -imageSize / 2, left: imageSize / 2 }} 
            onPress={onAccountPress} 
            account={authorInfo} size={imageSize / 3 * 2} />
    </View>
}

export default ResourceImageWithCreator