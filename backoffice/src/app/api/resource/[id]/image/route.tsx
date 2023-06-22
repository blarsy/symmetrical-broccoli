import { getAccount } from "@/apiutil"
import { getOne, update, uploadResourceImage } from "@/noco"
import { createFailureResponse, createSuccessResponse } from "@/respond"
import { Image, fromRawResource } from "@/schema"
import { NextRequest } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const token = request.headers.get('Authorization') as string
        //check if token is valid and not expired
        const account = await getAccount(token)
        //check if resource belongs to the logged in account
        if(!account.resources.find((res) => res.id == Number(params.id))) {
            return createFailureResponse(request, new Error('Resource not found'), 404)
        }
        
        const data = await request.formData()
        const files = data.getAll('files[]')

        const blobs = files.map(file => file as Blob)

        const res = await uploadResourceImage('ressources/images', account, Number(params.id), blobs)
        
        return createSuccessResponse(fromRawResource(res))
    } catch(e: any) {
        return createFailureResponse(request, e)
    }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const token = request.headers.get('Authorization') as string
        //check if token is valid and not expired
        const account = await getAccount(token)
        //check if resource belongs to the logged in account
        if(!account.resources.find((res) => res.id == Number(params.id))) {
            return createFailureResponse(request, new Error('Resource not found'), 404)
        }

        const { path } = await request.json()

        const resource = await getOne('ressources', `(Id,eq,${params.id}`, ['images'])
        resource.images = JSON.parse(resource.images)

        const imageToDelete = resource.images.find((image: Image) => image.path === path)
        if(!imageToDelete) return createFailureResponse(request, 'Image not found.', 404)

        const res = await update('ressources', Number(params.id), { images: resource.images.filter((image: any) => image.path !== path) })
        return createSuccessResponse(fromRawResource(res))
    } catch(e: any) {
        return createFailureResponse(request, e)
    }
}
