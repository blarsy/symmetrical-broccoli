import { Category, Condition, Resource, categoriesToRaw, conditionsToRaw, fromRawResource, resourceCategoriesFromRaw } from "@/schema"
import { bulkCreate, link, list, create as nocoCreate } from '@/server/noco'
import { getAccount, getResource } from "../apiutil"

export const create = async (accountId: number, title: string, description: string, expiration: Date, conditions: Condition[], categories: Category[]): Promise<Resource> => {
    const resourceRaw = await nocoCreate('ressources', { titre: title , description, expiration })
    const resource = fromRawResource(resourceRaw)

    const linkAccountPromise = link('comptes', accountId, 'ressources', resource.id.toString())
    const conditionsCreatePromise = bulkCreate('conditions', conditionsToRaw(conditions))
    const categoriesLinkPromise = Promise.all(categories.map((cat: Category) => link('ressources', resource.id, 'categories', cat.id.toString())))

    const conditionsRes = await conditionsCreatePromise
    const conditionsPromises = conditionsRes.map(async (condition: any) => {
        return link('ressources', resource.id, 'conditions', condition.id)
    })
    await Promise.all([ categoriesLinkPromise, linkAccountPromise, ...conditionsPromises ])
    resource.conditions = conditions
    resource.categories = categories
    return resource
}

export const getCategories = async (): Promise<Category[]> => {
    const categoriesRaw = await list('categories', undefined, undefined, undefined, 'nom', 10000)
    return resourceCategoriesFromRaw(categoriesRaw)
}

export const getSuggestions = async (token: string, searchText: string, categories?: string[]): Promise<Resource[]> => {
    const account = await getAccount(token, ['Id', 'nom'])
    let filter = `(comptes,neq,${account.name})~and(expiration,gt,today)${searchText ? `~and((titre,like,%${searchText}%)~or(description,like,%${searchText}%))` : ''}`
    
    let resourcesOfCategory: number[] = []
    if(categories && categories.length > 0) {
        const categoriesAndResources = await list('categories', `(Id,in,${categories.join(',')})`, ['ressources List'], undefined, undefined, 10000000) as {['ressources List']: { Id: number }[]}[]
        resourcesOfCategory = categoriesAndResources.filter(cr => !!cr['ressources List']).map(cr => cr['ressources List'].map(r => r.Id)).flat()
        console.log(resourcesOfCategory)
        
        if(resourcesOfCategory.length > 0) {
            filter += `~and(Id,in,${resourcesOfCategory.join(',')})`
        } else {
            filter = '(Id,eq,-1)'
        }
    }
    
    const resourceRaw = await list('ressources', filter, ['Id'], undefined, ['expiration','titre'])
    return Promise.all(resourceRaw.map(raw => getResource(raw.Id)))
}