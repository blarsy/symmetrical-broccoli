import { ImageSourcePropType } from "react-native"
import { cloudinaryCloud, cloudinaryUploadPreset, cloudinaryRestUrl } from "./settings"
import { Cloudinary } from "@cloudinary/url-gen"

export const IMAGE_BORDER_RADIUS = 15

const cld = new Cloudinary({
    cloud: {
        cloudName: cloudinaryCloud
    }
})


export const uploadImage = async (path: string):Promise<string> => {
    const formData = new FormData()

    formData.append('unsigned', true)
    formData.append('upload_preset', cloudinaryUploadPreset)
    if(path.includes('base64')){
        formData.append('file', path)
    } else {
        formData.append('file', {name: "file", uri: path, type: 'image/jpeg'})
    }

    const res = await fetch(`${cloudinaryRestUrl}${cloudinaryCloud}/image/upload`, { method: 'POST', body: formData })
    const parsedResult = await res.json()
    return (parsedResult as any).public_id
}

export const urlFromPublicId = (publicId: string) => cld.image(publicId).toURL()

export const imgSourceFromPublicId = (publicId: string): ImageSourcePropType  => {
    if(publicId) {
        const uri = cld.image(publicId).toURL()
        if(uri) return { uri }
    }
    return require('@/assets/img/placeholder.png')
}