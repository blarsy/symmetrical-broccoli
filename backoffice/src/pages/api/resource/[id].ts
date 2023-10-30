import { getAccount, getResource } from "@/server/apiutil"
import { bulkCreate, bulkDelete, bulkUpdate, getChildItems, getOne, link, remove, unlink, update } from "@/server/noco"
import { getToken, respondWithFailure, respondWithSuccess } from "@/server/respond"
import { Category, conditionsToRaw } from "@/schema"
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

            const { title, description, expiration, conditions, categories } = req.body
    
            if(!account.resources || !account.resources.some(res => res.id === resourceId)) {
                respondWithFailure(req, res, 'Resource not found', 404)
                return
            }
            const promisesToAwait: Promise<any>[] = []
            const currentDataPromise = getOne('ressources', `(Id,eq,${resourceId})`, ['Id', 'titre', 'description', 'expiration', 'images', 'conditions', 'categories'])
            const currentConditionsPromise = getChildItems('conditions', resourceId, `ressources` )

            const conditionsToAdd = conditionsToRaw(conditions.filter((condition: any) => !condition.id))
            if(conditionsToAdd.length > 0){
                promisesToAwait.push(bulkCreate('conditions', conditionsToAdd).then((addedConditions: any[]) => Promise.all(addedConditions.map((condition: any) => link('ressources', resourceId, 'conditions', condition.id)))))
            }
            
            const currentConditions = await currentConditionsPromise
            const conditionsToDelete = currentConditions.filter((condition: any) => !conditions.some((newCondition: any) => newCondition.id === condition.Id))
            const conditionsToUpdate = conditionsToRaw(conditions.filter((condition: any) => 
                currentConditions.some((existingCondition: any) => 
                    existingCondition.Id === condition.id && (existingCondition.titre !== condition.title || existingCondition.description !== condition.description))))
            
            if(conditionsToDelete.length > 0) {
                promisesToAwait.push(bulkDelete('conditions', conditionsToDelete.map(condition => ({ id: condition.Id }))))
            }
            promisesToAwait.push(bulkUpdate('conditions', conditionsToUpdate))
    
            const currentData = await currentDataPromise
            promisesToAwait.push(Promise.all(categories.filter((cat: Category) => !currentData.categories.some((existingCat: any) => existingCat.Id === cat.id ))
                .map((cat: Category) => link('ressources', resourceId, 'categories', cat.id.toString()))))
            promisesToAwait.push(Promise.all(currentData.categories.filter((existingCat: any) => !categories.some((cat: Category) => cat.id === existingCat.Id))
                .map((cat: any) => unlink('ressources', resourceId, 'categories', cat.Id.toString()))))
            
            const input = { Id: resourceId, titre: title , description, expiration, images: currentData.images }

            await promisesToAwait
            const resource = await update('ressources', resourceId, input)

            respondWithSuccess(res, await getResource(resource.Id))
        } catch(e: any) {
            respondWithFailure(req, res, e)
        }
    } else if (req.method === 'DELETE') {
        try {
            const { id } = req.query
            const resourceId = Number(id)
            const account = await getAccount(getToken(req))
    
            if(!account.resources || !account.resources.some(res => res.id === resourceId)) {
                respondWithFailure(req, res, 'Resource not found', 404)
                return
            }

            await remove('ressources', id as string)

            respondWithSuccess(res)
        } catch (e: any) {
            respondWithFailure(req, res, e)
        }
    } else {
        res.end()
    }
}