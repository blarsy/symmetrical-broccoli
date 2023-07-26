export const isValidPassword = (password?: string) => !!password && password.length > 7 && !!password.match(/[A-Z]/) && !!password.match(/[^\w]/)
