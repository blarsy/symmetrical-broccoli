import { Condition, Resource, conditionsToRaw, fromRawResource } from "@/schema"
import { bulkCreate, link, list, create as nocoCreate } from '@/server/noco'
import { getAccount } from "../apiutil"

export const create = async (accountId: number, title: string, description: string, expiration: Date, conditions: Condition[]): Promise<Resource> => {
    const resourceRaw = await nocoCreate('ressources', { titre: title , description, expiration })
    const resource = fromRawResource(resourceRaw)
    await link('comptes', accountId, 'ressources', resource.id.toString())

    const conditionsRes = await bulkCreate('conditions', conditionsToRaw(conditions))
    
    await Promise.all(conditionsRes.map(async (condition: any) => {
        return link('ressources', resource.id, 'conditions', condition.id)
    }))
    resource.conditions = conditions
    return resource
}

export const getSuggestions = async (token: string): Promise<Resource[]> => {
    const account = await getAccount(token, ['Id', 'comptes_liés', 'images', 'nom'])
    const resourceRaw = await list('ressources', `(comptes,neq,${account.name})~and(expiration,gt,today)`, ['Id', 'titre', 'description', 'expiration', 'comptes', 'images', 'conditions'], undefined, ['expiration','titre'])
    return resourceRaw.map(raw => fromRawResource(raw))
}