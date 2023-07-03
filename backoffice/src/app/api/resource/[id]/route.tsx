import { getAccount } from "@/server/apiutil"
import { bulkCreate, bulkDelete, bulkUpdate, getChildItems, getOne, link, list, update } from "@/server/noco"
import { createFailureResponse, createSuccessResponse } from "@/server/respond"
import { conditionsToRaw, fromRawResource } from "@/schema"
import { NextRequest } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const token = request.headers.get('Authorization') as string
        const account = await getAccount(token)
        if(!account.resources.find(res => res.id == Number(params.id))) return createFailureResponse(request, new Error('Resource not found'), 404)
        const resource = await getOne('ressources', `(Id,eq,${params.id})`, ['Id', 'titre', 'description', 'images', 'conditions', 'expiration'])
        const conditions = await getChildItems('conditions', resource.Id, 'ressources')
        resource.conditions = conditions
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
        const { title, description, expiration, conditions } = await request.json()

        const account = await accountPromise
        if(!account.resources.find(res => res.id === id)) return createFailureResponse(request, 'Resource not found', 404)
        const currentData = await getOne('ressources', `(Id,eq,${id})`, ['Id', 'titre', 'description', 'expiration', 'images', 'conditions'])
        const currentConditions = await getChildItems('conditions', id, `ressources` )

        const conditionsToAdd = conditionsToRaw(conditions.filter((condition: any) => !condition.id))
        const conditionsToDelete = currentConditions.filter((condition: any) => !conditions.some((newCondition: any) => newCondition.id === condition.Id))
        const conditionsToUpdate = conditionsToRaw(conditions.filter((condition: any) => 
            currentConditions.some((existingCondition: any) => 
                existingCondition.Id === condition.id && (existingCondition.titre !== condition.title || existingCondition.description !== condition.description))))

 
        const addedConditions = conditionsToAdd.length > 0 ? await bulkCreate('conditions', conditionsToAdd) : []
        if(conditionsToDelete.length > 0) {
            await bulkDelete('conditions', conditionsToDelete.map(condition => ({ id: condition.Id })))
        }
        const updatedConditions = await bulkUpdate('conditions', conditionsToUpdate)

        const input = { Id: id, titre: title , description, expiration, images: currentData.images }

        if(addedConditions) {
            await Promise.all(addedConditions.map((condition: any) => link('ressources', id, 'conditions', condition.id)))
        }
        
        const res = await update('ressources', id, input)
        const upToDateConditions = await getChildItems('conditions', res.Id, 'ressources')
        res.conditions = upToDateConditions

        return createSuccessResponse(fromRawResource(res))
    } catch(e: any) {
        return createFailureResponse(request, e)
    }
}