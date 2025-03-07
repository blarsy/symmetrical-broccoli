import { getCommonConfig } from "@/config"
import { Cloudinary } from "@cloudinary/url-gen"

const { cloudinaryCloud, cloudinaryRestUrl, cloudinaryUploadPreset } = getCommonConfig()

const cld = new Cloudinary({
    cloud: {
        cloudName: cloudinaryCloud
    }
})

export const urlFromPublicId = (publicId: string) => cld.image(publicId).toURL()

export const uploadImage = async (path: string):Promise<string> => {
    const formData = new FormData()

    formData.append('unsigned', 'true')
    formData.append('upload_preset', cloudinaryUploadPreset)
    formData.append('file', path)

    const res = await fetch(`${cloudinaryRestUrl}${cloudinaryCloud}/image/upload`, { method: 'POST', body: formData })
    const parsedResult = await res.json()
    return (parsedResult as any).public_id
}