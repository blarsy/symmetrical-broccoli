import { getAccount } from "@/apiutil"
import { getOne, update } from "@/noco"
import { createFailureResponse, createSuccessResponse } from "@/respond"
import { fromRawResource } from "@/schema"
import { NextRequest } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const token = request.headers.get('Authorization') as string
        const account = await getAccount(token)
        if(!account.resources.find(res => res.id == Number(params.id))) return createFailureResponse(request, new Error('Resource not found'), 404)
        const resource = await getOne('ressources', `(Id,eq,${params.id})`, ['Id', 'titre', 'description', 'images', 'conditions', 'expiration'])
        
        if(!resource) return createFailureResponse(request, new Error('Resource not found'), 404)
        return createSuccessResponse(fromRawResource(resource))
    } catch(e: any) {
        return createFailureResponse(request, e)
    }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = Number(params.id)
        const token = request.headers.get('Authorization') as string
        const accountPromise = await getAccount(token)
        const { title, description, expiration } = await request.json()

        const account = await accountPromise
        if(!account.resources.find(res => res.id === id)) return createFailureResponse(request, 'Resource not found', 404)
        const currentData = await getOne('ressources', `(Id,eq,${id})`, ['Id', 'titre', 'description', 'expiration', 'images', 'conditions'])
        const input = { Id: id, titre: title , description, expiration, images: currentData.images, conditions: currentData.conditions }

        const res = await update('ressources', id, input)
        return createSuccessResponse(fromRawResource(res))
    } catch(e: any) {
        return createFailureResponse(request, e)
    }
}