import { Category, Resource, fromRawResource, resourceCategoriesFromRaw } from "@/schema"
import { link, list, create as nocoCreate } from '@/server/noco'
import { getAccount, getResource } from "../apiutil"

export const create = async (accountId: number, title: string, description: string, expiration: Date, categories: Category[], 
        isProduct: boolean, isService: boolean, canBeDelivered: boolean, canBeTakenAway: boolean, 
        canBeGifted: boolean, canBeExchanged: boolean): Promise<Resource> => {
    const resourceRaw = await nocoCreate('ressources', { titre: title , description, expiration, produit: isProduct, 
        service: isService, livraison: canBeDelivered, aEmporter: canBeTakenAway, trocOk: canBeExchanged, donOk: canBeGifted })
    const resource = fromRawResource(resourceRaw)

    const linkAccountPromise = link('comptes', accountId, 'ressources', resource.id.toString())
    const categoriesLinkPromise = Promise.all(categories.map((cat: Category) => link('ressources', resource.id, 'categories', cat.id.toString())))

    await Promise.all([ categoriesLinkPromise, linkAccountPromise ])
    resource.categories = categories
    return resource
}

export const getCategories = async (): Promise<Category[]> => {
    const categoriesRaw = await list('categories', undefined, undefined, undefined, 'nom', 10000)
    return resourceCategoriesFromRaw(categoriesRaw)
}

export const getSuggestions = async (token: string, searchText: string, isProduct: boolean, isService: boolean,
    canBeDelivered: boolean, canBeTakenAway: boolean, canBeExchanged: boolean, canBeGifted: boolean, categories?: string[]): Promise<Resource[]> => {
    const account = await getAccount(token, ['Id', 'nom'])
    const andFilters = []
    andFilters.push(`(comptes,neq,${account.name})`)
    andFilters.push(`(expiration,gt,today)`)
    if(searchText) andFilters.push(`(titre,like,%${searchText}%)`)

    if(isProduct || isService){
        if(isProduct && isService) {
            andFilters.push(`((produit,eq,true)~or(service,eq,true))`)
        } else {
            if(isProduct) andFilters.push(`(produit,eq,true)`)
            else andFilters.push(`(service,eq,true)`)
        }
    }
    if(canBeDelivered || canBeTakenAway){
        if(canBeDelivered && canBeTakenAway) {
            andFilters.push(`((livraison,eq,true)~or(aEmporter,eq,true))`)
        } else {
            if(canBeDelivered) andFilters.push(`(livraison,eq,true)`)
            else andFilters.push(`(aEmporter,eq,true)`)
        }
    }
    if(canBeGifted || canBeExchanged){
        if(canBeGifted && canBeExchanged) {
            andFilters.push(`((donOk,eq,true)~or(trocOk,eq,true))`)
        } else {
            if(canBeGifted) andFilters.push(`(donOk,eq,true)`)
            else andFilters.push(`(trocOk,eq,true)`)
        }
    }

    let filter = andFilters.join('~and')

    let resourcesOfCategory: number[] = []
    if(categories && categories.length > 0) {
        const categoriesAndResources = await list('categories', `(Id,in,${categories.join(',')})`, ['ressources List'], undefined, undefined, 10000000) as {['ressources List']: { Id: number }[]}[]
        resourcesOfCategory = categoriesAndResources.filter(cr => !!cr['ressources List']).map(cr => cr['ressources List'].map(r => r.Id)).flat()
        
        if(resourcesOfCategory.length > 0) {
            filter += `~and(Id,in,${resourcesOfCategory.join(',')})`
        } else {
            filter = '(Id,eq,-1)'
        }
    }
    
    const resourceRaw = await list('ressources', filter, ['Id'], undefined, ['expiration','titre'])
    return Promise.all(resourceRaw.map(raw => getResource(raw.Id)))
}