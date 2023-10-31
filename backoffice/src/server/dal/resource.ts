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
    const categoriesRaw = await list('categories')
    return resourceCategoriesFromRaw(categoriesRaw)
}

export const getSuggestions = async (token: string, searchText: string): Promise<Resource[]> => {
    const account = await getAccount(token, ['Id', 'comptes_liés', 'images', 'nom'])
    const filter = `(comptes,neq,${account.name})~and(expiration,gt,today)${searchText && `~and((titre,like,%${searchText}%)~or(description,like,%${searchText}%))`}`
    
    const resourceRaw = await list('ressources', filter, ['Id'], undefined, ['expiration','titre'])
    return Promise.all(resourceRaw.map(raw => getResource(raw.Id)))
}