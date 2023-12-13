import { NewOrExistingImage } from '@/components/EditResourceContextProvider'
import { Account, Category, ConversationData, Message, Network, Resource } from './schema'
import { apiUrl } from './settings'
import { Platform } from 'react-native'
import { IMessage } from 'react-native-gifted-chat'
import { SearchOptions } from '@/components/AppContextProvider'
let loggedOutHandler: () => void

export const registerLoggedOutHandler = (handler: () => void) => {
    loggedOutHandler = handler
}

export const login = async (email: string, password: string) => {
    return apiCall(`${apiUrl}auth`, { method: 'POST', body: JSON.stringify({email, password}), mode: 'cors', headers: {
        'Content-Type': 'application/json'
    }})
}

export const register = async (email: string, password: string, name: string) => {
    return apiCall(`${apiUrl}user`, { method: 'POST', body: JSON.stringify({ name, email, password }), mode: 'cors', headers: {
        'Content-Type': 'application/json'
    }})
}

export const getAccount = async (token: string): Promise<Account> => {
    const res = await apiCall(`${apiUrl}user`, { method: 'GET', mode: 'cors', headers: {
        'Authorization': token
    }})
    if(res.status === 200) {
        return (await res.json()).account
    } else {
        throw new Error(res.statusText)
    }
}

export const getNetwork = async (token: string): Promise<Network> => {
    const res = await apiCall(`${apiUrl}user/network`, { method: 'GET', mode: 'cors', headers: {
        'Authorization': token
    }})
    if(res.status === 200) {
        const network = (await res.json())
        return network
    } else {
        throw new Error(res.statusText)
    }
}

export const updateAccount = async (token: string, password: string, newPassword: string, name: string, email: string): Promise<Account> => {
    const res = await apiCall(`${apiUrl}user`, { method: 'PATCH', body: JSON.stringify({email, password, newPassword, name}), mode: 'cors', headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
    }})
    if(res.status === 200) {
        return res.json()
    } else {
        throw new Error(res.statusText)
    }
}

export const searchAccount = async (input: string, token: string): Promise<Account[]> => {
    const res = await (apiCall(`${apiUrl}account?search=${encodeURI(input)}`, { method: 'GET', mode: 'cors', headers: {
        'Authorization': token
    }}))
    if(res.status === 200) {
        return res.json()
    } else {
        throw new Error(res.statusText)
    }
}

export const sendInvitation = async (targetAccountId: number, token: string) => {
    await (apiCall(`${apiUrl}user/linkrequest`, { method: 'POST', body: JSON.stringify({target: targetAccountId}), mode: 'cors', headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
    }}))
}

export const acceptInvitation = async (targetAccountId: number, token: string) => {
    await (apiCall(`${apiUrl}user/linkrequest`, { method: 'PATCH', body: JSON.stringify({target: targetAccountId, accept: 1}), mode: 'cors', headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
    }}))
}

export const declineInvitation = async (targetAccountId: number, token: string) => {
    await (apiCall(`${apiUrl}user/linkrequest`, { method: 'PATCH', body: JSON.stringify({target: targetAccountId, accept: 0}), mode: 'cors', headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
    }}))
}

export const cancelInvitation = async (targetAccountId: number, token: string) => {
    await (apiCall(`${apiUrl}user/linkrequest/${targetAccountId}`, { method: 'DELETE', mode: 'cors', headers: {
        'Authorization': token
    }}))
}

export const removeFriend = async (targetAccountId: number, token: string) => {
    await (apiCall(`${apiUrl}user/friend/${targetAccountId}`, { method: 'DELETE', mode: 'cors', headers: {
        'Authorization': token
    }}))
}

export const requestRecovery = async (email: string) => {
    return await apiCall(`${apiUrl}user/recovery`, { method: 'PUT', body: JSON.stringify({ email }), mode: 'cors', headers: {
        'Content-Type': 'application/json'
    }})
}

export const getResources = async (token: string): Promise<Resource[]> => {
    const res = await apiCall(`${apiUrl}resource`, { method: 'GET', mode: 'cors', headers: {
        'Authorization': token
    }})
    if(res.status === 200) {
        return ((await res.json()) as Resource[]).map(res => resourceFromApi(res))
    } else {
        throw new Error(res.statusText)
    }
}

export const getResource = async (resourceId: number): Promise<Resource> => {
    const res = await apiCall(`${apiUrl}resource/${resourceId}`, { method: 'GET', mode: 'cors'})
    if(res.status === 200) {
        return resourceFromApi((await res.json()) as Resource)
    } else {
        throw new Error(res.statusText)
    }
}

export const getResourceCategories = async () => {
    const res = await apiCall(`${apiUrl}resource/categories`, { method: 'GET', mode: 'cors' })
    if(res.status === 200) {
        return (await res.json()) as Category[]
    } else {
        throw new Error(res.statusText)
    }
}

const resourceFromApi = (rawResource: Resource) => {
    if(typeof rawResource.images === 'string') {
        rawResource.images = JSON.parse(rawResource.images)
    }
    if(typeof(rawResource.expiration) === 'string') {
        rawResource.expiration = new Date(rawResource.expiration as unknown as string)
    }
    return rawResource
}

export const createResource = async (token: string, resource: Resource): Promise<Resource> => {
    const strippedResource = {...resource}
    strippedResource.images = []
    const res = await apiCall(`${apiUrl}resource`, { method: 'POST', body: JSON.stringify(strippedResource), mode: 'cors', headers: {
        'Authorization': token
    }})
    if(res.status === 200) {
        return resourceFromApi(await res.json())
    } else {
        throw new Error(res.statusText)
    }
}

export const updateResource = async (token: string, resource: Resource): Promise<Resource> => {
    const res = await apiCall(`${apiUrl}resource/${resource.id}`, { method: 'POST', body: JSON.stringify(resource), mode: 'cors', headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
    }})
    if(res.status === 200) {
        return resourceFromApi(await res.json())
    } else {
        throw new Error(res.statusText)
    }
}

export const deleteResource = async (token: string, resourceId: number): Promise<void> => {
    const res = await apiCall(`${apiUrl}resource/${resourceId}`, { method: 'DELETE', mode: 'cors', headers: {
        'Authorization': token
    }})
    if(res.status === 200) {
        return;
    } else {
        throw new Error(res.statusText)
    }
}

export const uploadImagesOnResource = async (token: string, resourceId: number, imgs: NewOrExistingImage[]): Promise<Resource> => {
    const formData = new FormData()
    imgs.forEach(img => formData.append('files[]', Platform.OS === "web" ? img.blob! : {uri: img.path, name: img.title, type: img.mimetype || 'image/jpeg'}))
    
    const res = await apiCall(`${apiUrl}resource/${resourceId}/image`, { method: 'POST', body: formData, mode: 'cors', headers: {
        'Authorization': token
    }})
    if(res.status === 200) {
        return resourceFromApi(await res.json())
    } else {
        throw new Error(res.statusText)
    }
}

export const removeImageFromResource = async (token: string, resourceId: number, path: string): Promise<Resource> => {
    const res = await apiCall(`${apiUrl}resource/${resourceId}/image`, { method: 'PATCH', body: JSON.stringify({ path }), mode: 'cors', headers: {
        'Authorization': token
    }})
    if(res.status === 200) {
        return resourceFromApi(await res.json())
    } else {
        throw new Error(res.statusText)
    }
}

export const getSuggestions = async(token: string, searchTerm: string, categories: string[], options?: SearchOptions): Promise<Resource[]> => {
    const queryTokens = []
    if(searchTerm) {
        queryTokens.push(`search=${searchTerm}`)
    }
    if(categories) {
        queryTokens.push(`categories=${categories.join(',')}`)
    }
    if(options) {
        options.canBeDelivered && queryTokens.push(`canBeDelivered=${options.canBeDelivered ? '1': '0'}`)
        options.canBeExchanged && queryTokens.push(`canBeExchanged=${options.canBeExchanged ? '1': '0'}`)
        options.canBeGifted && queryTokens.push(`canBeGifted=${options.canBeGifted ? '1': '0'}`)
        options.canBeTakenAway && queryTokens.push(`canBeTakenAway=${options.canBeTakenAway ? '1': '0'}`)
        options.isProduct && queryTokens.push(`isProduct=${options.isProduct ? '1': '0'}`)
        options.isService && queryTokens.push(`isService=${options.isService ? '1': '0'}`)
    }
    const res = await apiCall(`${apiUrl}resource/suggestions${queryTokens.length > 0 ? `?${queryTokens.join('&')}` : ''}`, { method: 'GET', mode: 'cors', headers:{
        'Authorization': token
    } })
    if(res.status === 200) {
        return ((await res.json()) as Resource[]).map(res => resourceFromApi(res))
    } else {
        throw new Error(res.statusText)
    }
}

export const getMessages = async(token: string, ressourceId: number): Promise<Message[]> => {
    const res = await apiCall(`${apiUrl}messages/${ressourceId}`, { method: 'GET', mode: 'cors', headers: {
        'Authorization': token
    }})
    if(res.status === 200) {
        return (await res.json()) as Message[]
    } else {
        throw new Error(res.statusText)
    }
}

export const sendChatMessages = async(token: string, resourceId: number, messages: IMessage[]): Promise<Message[]> => {
    const res = await apiCall(`${apiUrl}messages/${resourceId}`, { method: 'POST', body: JSON.stringify({ messages: messages.map((msg: IMessage) => ({ text: msg.text, image: msg.image }))}), mode: 'cors', headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
    }})
    if(res.status === 200) {
        return (await res.json()) as Message[]
    } else {
        throw new Error(res.statusText)
    }
}

export const getConversation = async(token: string, resourceId: number): Promise<any> => {
    const res = await apiCall(`${apiUrl}conversations/${resourceId}`, { method: 'GET', mode: 'cors', headers: {
        'Authorization': token
    } })
    if(res.status === 200) {
        return await res.json()
    } else {
        throw new Error(res.statusText)
    }
}

export const ensureChatSocketActive = async(): Promise<void> => {
    const res = await apiCall(`${apiUrl}chatio`, { method: 'GET', mode: 'cors' })
    if(res.status != 200) {
        throw new Error(res.statusText)
    }
}

export const getPastConversations = async(token: string): Promise<ConversationData[]> => {
    const res = await apiCall(`${apiUrl}conversations`, { method: 'GET', mode: 'cors', headers: {
        'Authorization': token
    } })
    if(res.status === 200) {
        return (await res.json()) as ConversationData[]
    } else {
        throw new Error(res.statusText)
    }
}

export const createConversation = async (token: string, resourceId: number, messageText: string, messageImage: string) => {
    const res = await apiCall(`${apiUrl}conversations/`, { method: 'POST', body: JSON.stringify({ resourceId, messageText, messageImage }), mode: 'cors', headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
    }})
    if(res.status === 200) {
        return resourceFromApi(await res.json())
    } else {
        throw new Error(res.statusText)
    }  
}

const apiCall = async (input: RequestInfo, init?: RequestInit): Promise<Response> => {
    try {
        const res = await fetch(input, init)
        
        if(res.status === 401 && ((await res.text()) === 'TOKEN_EXPIRED')) {
            if(!loggedOutHandler) throw new Error('Please call "registerLoggedOutHandler" first.')
            loggedOutHandler()
            return res
        }
        if(res.status >= 400) {
            throw new Error(`Code ${res.status}, ${res.statusText}, ${await res.text()}\nRequest: ${input}, ${init && JSON.stringify(init)}`)
        }
        return res
    } catch (e) {
        throw new Error(`Fetching ${input} ${init && `failed with ${JSON.stringify(init)}`}., ${e}`)
    }
}