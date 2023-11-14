export const isValidPassword = (password?: string) => !!password && password.length > 7 && !!password.match(/[A-Z]/) && !!password.match(/[^\w]/)
export const primaryColor = '#ff4401'
export const lightPrimaryColor = '#fef0e3'
export const DUPLICATE_EMAIL = 'DUPLICATE_EMAIL'
export const DUPLICATE_NAME = 'DUPLICATE_NAME'