import { randomInt } from "crypto"

export const isValidPassword = (password?: string) => !!password && password.length > 7 && !!password.match(/[A-Z]/) && !!password.match(/[^\w]/)
export const primaryColor = '#ff4401'
export const lightPrimaryColor = '#fef0e3'
export const DUPLICATE_EMAIL = 'DUPLICATE_EMAIL'
export const DUPLICATE_NAME = 'DUPLICATE_NAME'
export const generateCode = (len: number) => {
    const chars = '1234567890AZERTYUIOPQSDFGHJKLMWXCVBN'
    const result:string[] = []
    for(let i = 0; i < len; i ++) {
        result.push(chars[randomInt(35)])
    }
    return result.join('')
}