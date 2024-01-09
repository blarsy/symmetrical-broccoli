import { cloudinaryCloud, cloudinaryUploadPreset, cloudinaryRestUrl } from "./settings"
import { Cloudinary } from "@cloudinary/url-gen"


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

    try {
        console.log('upload url', `${cloudinaryRestUrl}${cloudinaryCloud}/image/upload`, 'formData', formData)
        const res = await fetch(`${cloudinaryRestUrl}${cloudinaryCloud}/image/upload`, { method: 'POST', body: formData })
        const parsedResult = await res.json()
        console.log('parsedResult', parsedResult)
        return parsedResult.public_id
    } catch(e) {
        console.log('e.toString()', e.toString(), 'e', e, 'stack', (e as Error).stack, 'message', (e as Error).message)
        return ''
    }
    
}

export const urlFromPublicId = (publicId: string) => cld.image(publicId).toURL()