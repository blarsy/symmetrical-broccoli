import { getCommonConfig } from "@/config"
import { Cloudinary } from "@cloudinary/url-gen"

const { cloudinaryCloud } = getCommonConfig()

const cld = new Cloudinary({
    cloud: {
        cloudName: cloudinaryCloud
    }
})

export const urlFromPublicId = (publicId: string) => cld.image(publicId).toURL()