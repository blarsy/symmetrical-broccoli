import { ReactNode } from "react"
import { RouteProps } from "./utils"
import { MaterialBottomTabNavigationOptions } from "react-native-paper"
import { ParamListBase, RouteProp } from "@react-navigation/native"

export interface TabNavigatorProps {
    name: string
    component: (r: RouteProps) => ReactNode
    options?: MaterialBottomTabNavigationOptions | ((props: {
        route: RouteProp<ParamListBase, string>
        navigation: any
    }) => MaterialBottomTabNavigationOptions)
}