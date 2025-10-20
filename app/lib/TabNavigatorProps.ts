import { ReactNode } from "react"
import { RouteProps } from "./utils"
import { MaterialBottomTabNavigationOptions } from "react-native-paper"
import { ParamListBase, RouteProp } from "@react-navigation/native"
import { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs'

export interface TabNavigatorProps {
    name: string
    component: (r: RouteProps) => ReactNode
    options?: BottomTabNavigationOptions
}