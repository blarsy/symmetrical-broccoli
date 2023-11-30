import { NavigationHelpers, ParamListBase } from "@react-navigation/native"
import { Dimensions } from "react-native"

export const isValidPassword = (password?: string) => !!password && password.length > 7 && !!password.match(/[A-Z]/) && !!password.match(/[^\w]/)

export interface RouteProps {
    route: any, 
    navigation: NavigationHelpers<ParamListBase>
}

export const mdScreenWidth = 600

export const aboveMdWidth = (): Boolean => Dimensions.get("window").width >= mdScreenWidth
export const hasMinWidth = (minWidth: number) => Dimensions.get("window").width >= minWidth

export enum ScreenSize {
    sm,
    md,
    lg
}

export const getScreenSize = (): ScreenSize => {
    if(aboveMdWidth()){
        if(hasMinWidth(900)) {
            return ScreenSize.lg
        }
        return ScreenSize.md
    } else {
        return ScreenSize.sm
    }
}