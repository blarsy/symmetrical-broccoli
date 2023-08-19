import {API_URL} from 'react-native-dotenv'
import { Account } from './schema'

let loggedOutHandler: () => void

export const registerLoggedOutHandler = (handler: () => void) => {
    loggedOutHandler = handler
}

export const login = async (email: string, password: string) => {
    return apiCall(makeFetchCall(`${API_URL}/auth`, { method: 'POST', body: JSON.stringify({email, password}), mode: 'cors', headers: {
        'Content-Type': 'application/json'
    }}))
}

export const register = async (email: string, password: string, name: string) => {
    return apiCall(makeFetchCall(`${API_URL}/user`, { method: 'POST', body: JSON.stringify({ name, email, password }), mode: 'cors', headers: {
        'Content-Type': 'application/json'
    }}))
}

export const getAccount = async (token: string): Promise<Account> => {
    const res = await apiCall(makeFetchCall(`${API_URL}/user`, { method: 'GET', mode: 'cors', headers: {
        'Authorization': token
    }}))
    return (await res.json()).account
}

export const updateAccount = async (token: string, password: string, newPassword: string, name: string, email: string): Promise<Account> => {
    const res = await apiCall(makeFetchCall(`${API_URL}/user`, { method: 'PATCH', body: JSON.stringify({email, password, newPassword, name}), mode: 'cors', headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
    }}))
    return res.json()
}

const makeFetchCall = (input: RequestInfo, init?: RequestInit): Promise<Response> => {
    console.log('API request : ', input, init)
    return fetch(input, init)
}

const apiCall = async (call: Promise<Response>): Promise<Response> => {
    try{
        const res = await call
        if(res.status === 401 && ((await res.text()) === 'TOKEN_EXPIRED')) {
            if(!loggedOutHandler) throw new Error('Please call "registerLoggedOutHandler" first.')
            loggedOutHandler()
            return res
        }
        if(res.status >= 400) {
            console.error('Error response returned.', res)
            throw new Error(`Code ${res.status}, ${res.statusText}, ${await res.text()}`)
        }
        return res
    } catch(e: any) {
        console.error((e as Error).message, (e as Error).stack)
        return new Response('', { status: 500, statusText: (e as Error).message })
    }
}