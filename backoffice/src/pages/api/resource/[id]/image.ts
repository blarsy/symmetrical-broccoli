import { getAccount, getResource } from "@/server/apiutil"
import { getOne, update, uploadResourceImage } from "@/server/noco"
import { Image } from "@/schema"
import { respondWithSuccess, respondWithFailure, getToken } from "@/server/respond"
import { NextApiRequest, NextApiResponse } from "next"
import formidable, { File } from "formidable"

export const config = {
    api: {
        bodyParser: false
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if(req.method === 'POST') {
        try {
            const account = await getAccount(getToken(req))

            const { id } = req.query
            const resourceId = Number(id)
            //check if resource belongs to the logged in account
            if(!account.resources || !account.resources.find((res) => res.id == resourceId)) {
                respondWithFailure(req, res, new Error('Resource not found'), 404)
                return
            }
            
            const form = formidable()
            const [_, files] = await form.parse(req)

            const filePaths = (files['files[]'] as File[]).map(file => file.filepath)
    
            const resource = await uploadResourceImage('ressources/images', account, resourceId, filePaths)
            
            respondWithSuccess(res, await getResource(resource.Id))
        } catch(e: any) {
            respondWithFailure(req, res, e)
        }
    } else if (req.method === 'PATCH') {
        try {
            //check if token is valid and not expired
            const account = await getAccount(getToken(req))
            //check if resource belongs to the logged in account
            const { id } = req.query
            const resourceId = Number(id)
            
            if(!account.resources || !account.resources.find((res) => res.id == resourceId)) {
                respondWithFailure(req, res, new Error('Resource not found'), 404)
                return
            }

            const readable = req.read()
            const buffer = Buffer.from(readable)
            const { path } = JSON.parse(buffer.toString())
    
            const resource = await getOne('ressources', `(Id,eq,${resourceId})`, ['images'])
            resource.images = JSON.parse(resource.images)
    
            const imageToDelete = resource.images.find((image: Image) => image.path === path)
            if(!imageToDelete) {
                respondWithFailure(req, res, new Error('Image not found.'), 404)
                return
            }

            const updatedResource = await update('ressources', resourceId, { images: resource.images.filter((image: any) => image.path !== path) })
            respondWithSuccess(res, await getResource(updatedResource.Id))
        } catch(e: any) {
            respondWithFailure(req, res, e)
        }
    } else {
        res.end()
    }
}