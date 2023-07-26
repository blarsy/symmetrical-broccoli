import {API_URL} from 'react-native-dotenv'
import { Account } from './schema'

let loggedOutHandler: () => void

export const registerLoggedOutHandler = (handler: () => void) => {
    loggedOutHandler = handler
}

export const login = async (email: string, password: string) => {
    return apiCall(fetch(`${API_URL}/auth`, { method: 'POST', body: JSON.stringify({email, password}), mode: 'cors', headers: {
        'Content-Type': 'application/json'
    }}))
}

export const getAccount = async (token: string): Promise<Account> => {
    const res = await apiCall(fetch(`${API_URL}/user`, { method: 'GET', mode: 'cors', headers: {
        'Authorization': token
    }}))
    return (await res.json()).account
}

export const updateAccount = async (token: string, password: string, newPassword: string, name: string, email: string): Promise<Account> => {
    const res = await apiCall(fetch(`${API_URL}/user`, { method: 'PATCH', body: JSON.stringify({email, password, newPassword, name}), mode: 'cors', headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
    }}))
    return res.json()
}

const apiCall = async (call: Promise<Response>): Promise<Response> => {
    try {
        const res = await call
        if(res.status === 401 && ((await res.text()) === 'TOKEN_EXPIRED')) {
            if(!loggedOutHandler) throw new Error('Please call "registerLoggedOutHandler" first.')
            loggedOutHandler()
            return res
        }
        if(res.status >= 400) throw new Error(`Code ${res.status}, ${res.statusText}, ${await res.text()}`)
        return res
    } catch (e: any) {
        console.log(e)
        throw e
    }
}