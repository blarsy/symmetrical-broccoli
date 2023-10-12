import { getAccount, getResource } from "@/server/apiutil"
import { bulkCreate, bulkDelete, bulkUpdate, getChildItems, getOne, link, update } from "@/server/noco"
import { getToken, respondWithFailure, respondWithSuccess } from "@/server/respond"
import { conditionsToRaw } from "@/schema"
import { NextApiRequest, NextApiResponse } from "next"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if(req.method === 'GET') {
        try {
            const account = await getAccount(getToken(req))
            const { id } = req.query
            const resourceId = Number(id)
            
            if(!account.resources || !account.resources.find(res => res.id == resourceId)) {
                respondWithFailure(req, res, new Error('Resource not found'), 404)
                return
            }
            const resource = await getResource(resourceId)

            respondWithSuccess(res, resource)
        } catch(e: any) {
            respondWithFailure(req, res, e)
        }
    } else if (req.method === 'POST') {
        try {
            const { id } = req.query
            const resourceId = Number(id)
            const account = await getAccount(getToken(req))
            const { title, description, expiration, conditions } = JSON.parse(req.body)
    
            if(!account.resources || !account.resources.some(res => res.id === resourceId)) {
                respondWithFailure(req, res, 'Resource not found', 404)
                return
            }
            const currentData = await getOne('ressources', `(Id,eq,${resourceId})`, ['Id', 'titre', 'description', 'expiration', 'images', 'conditions'])
            const currentConditions = await getChildItems('conditions', resourceId, `ressources` )

            const conditionsToAdd = conditionsToRaw(conditions.filter((condition: any) => !condition.id))
            const conditionsToDelete = currentConditions.filter((condition: any) => !conditions.some((newCondition: any) => newCondition.id === condition.Id))
            const conditionsToUpdate = conditionsToRaw(conditions.filter((condition: any) => 
                currentConditions.some((existingCondition: any) => 
                    existingCondition.Id === condition.id && (existingCondition.titre !== condition.title || existingCondition.description !== condition.description))))
    
     
            const addedConditions = conditionsToAdd.length > 0 ? await bulkCreate('conditions', conditionsToAdd) : []
            if(conditionsToDelete.length > 0) {
                await bulkDelete('conditions', conditionsToDelete.map(condition => ({ id: condition.Id })))
            }
            await bulkUpdate('conditions', conditionsToUpdate)
    
            const input = { Id: resourceId, titre: title , description, expiration, images: currentData.images }
    
            if(addedConditions) {
                await Promise.all(addedConditions.map((condition: any) => link('ressources', resourceId, 'conditions', condition.id)))
            }
            
            const resource = await update('ressources', resourceId, input)

            respondWithSuccess(res, await getResource(resource.Id))
        } catch(e: any) {
            respondWithFailure(req, res, e)
        }
    } else {
        res.end()
    }
}