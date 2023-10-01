import { NavigationHelpers, ParamListBase } from "@react-navigation/native"

export const isValidPassword = (password?: string) => !!password && password.length > 7 && !!password.match(/[A-Z]/) && !!password.match(/[^\w]/)

export interface RouteProps {
    route: any, 
    navigation: NavigationHelpers<ParamListBase>
}