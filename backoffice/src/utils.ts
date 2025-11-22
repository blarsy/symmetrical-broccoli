export const isValidPassword = (password?: string) => !!password && password.length > 7 && !!password.match(/[A-Z]/) && !!password.match(/[^\w]/)
export const primaryColor = '#ff4401'
export const lightPrimaryColor = '#fef0e3'

export const fromToday = (days: number) =>
    new Date(new Date().valueOf() + 1000 * 60 * 60 * 24 * days)
