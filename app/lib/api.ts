import { Account, Network } from './schema'
import { apiUrl } from './settings'
let loggedOutHandler: () => void

export const registerLoggedOutHandler = (handler: () => void) => {
    loggedOutHandler = handler
}

export const login = async (email: string, password: string) => {
    return apiCall(`${apiUrl}/auth`, { method: 'POST', body: JSON.stringify({email, password}), mode: 'cors', headers: {
        'Content-Type': 'application/json'
    }})
}

export const register = async (email: string, password: string, name: string) => {
    return apiCall(`${apiUrl}/user`, { method: 'POST', body: JSON.stringify({ name, email, password }), mode: 'cors', headers: {
        'Content-Type': 'application/json'
    }})
}

export const getAccount = async (token: string): Promise<Account> => {
    const res = await apiCall(`${apiUrl}/user`, { method: 'GET', mode: 'cors', headers: {
        'Authorization': token
    }})
    if(res.status === 200) {
        return (await res.json()).account
    } else {
        throw new Error(res.statusText)
    }
}

export const getNetwork = async (token: string): Promise<Network> => {
    const res = await apiCall(`${apiUrl}/user/network`, { method: 'GET', mode: 'cors', headers: {
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
    const res = await apiCall(`${apiUrl}/user`, { method: 'PATCH', body: JSON.stringify({email, password, newPassword, name}), mode: 'cors', headers: {
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
    const res = await (apiCall(`${apiUrl}/account?search=${encodeURI(input)}`, { method: 'GET', mode: 'cors', headers: {
        'Authorization': token
    }}))
    if(res.status === 200) {
        return res.json()
    } else {
        throw new Error(res.statusText)
    }
}

export const sendInvitation = async (targetAccountId: number, token: string) => {
    await (apiCall(`${apiUrl}/user/linkrequest`, { method: 'POST', body: JSON.stringify({target: targetAccountId}), mode: 'cors', headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
    }}))
}

export const acceptInvitation = async (targetAccountId: number, token: string) => {
    await (apiCall(`${apiUrl}/user/linkrequest`, { method: 'PATCH', body: JSON.stringify({target: targetAccountId, accept: 1}), mode: 'cors', headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
    }}))
}

export const declineInvitation = async (targetAccountId: number, token: string) => {
    await (apiCall(`${apiUrl}/user/linkrequest`, { method: 'PATCH', body: JSON.stringify({target: targetAccountId, accept: 0}), mode: 'cors', headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
    }}))
}

export const cancelInvitation = async (targetAccountId: number, token: string) => {
    await (apiCall(`${apiUrl}/user/linkrequest/${targetAccountId}`, { method: 'DELETE', mode: 'cors', headers: {
        'Authorization': token
    }}))
}

export const removeFriend = async (targetAccountId: number, token: string) => {
    await (apiCall(`${apiUrl}/user/friend/${targetAccountId}`, { method: 'DELETE', mode: 'cors', headers: {
        'Authorization': token
    }}))
}

export const requestRecovery = async (email: string) => {
    return await apiCall(`${apiUrl}/user/recovery`, { method: 'PUT', body: JSON.stringify({ email }), mode: 'cors', headers: {
        'Content-Type': 'application/json'
    }})
}

const apiCall = async (input: RequestInfo, init?: RequestInit): Promise<Response> => {
    const res = await  fetch(input, init)
    if(res.status === 401 && ((await res.text()) === 'TOKEN_EXPIRED')) {
        if(!loggedOutHandler) throw new Error('Please call "registerLoggedOutHandler" first.')
        loggedOutHandler()
        return res
    }
    if(res.status >= 400) {
        console.error('Error response returned.', res)
        throw new Error(`Code ${res.status}, ${res.statusText}, ${await res.text()}\nRequest: ${input}, ${init && JSON.stringify(init)}`)
    }
    return res
}