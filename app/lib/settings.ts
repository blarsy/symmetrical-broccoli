import { EXPO_PUBLIC_API_URL, EXPO_PUBLIC_DIAGNOSTIC, EXPO_PUBLIC_IMG_URL } from 'react-native-dotenv'
import { Dimensions } from 'react-native'

export const apiUrl = process.env.EXPO_PUBLIC_API_URL || EXPO_PUBLIC_API_URL
export const diagnostic = process.env.EXPO_PUBLIC_DIAGNOSTIC || EXPO_PUBLIC_DIAGNOSTIC
export const imgUrl = process.env.EXPO_PUBLIC_IMG_URL || EXPO_PUBLIC_IMG_URL

console.log('process.env.EXPO_PUBLIC_API_URL', process.env.EXPO_PUBLIC_API_URL, 'EXPO_PUBLIC_API_URL', EXPO_PUBLIC_API_URL,
'process.env.EXPO_PUBLIC_DIAGNOSTIC', process.env.EXPO_PUBLIC_DIAGNOSTIC, 'EXPO_PUBLIC_DIAGNOSTIC', EXPO_PUBLIC_DIAGNOSTIC)

export const mdScreenWidth = 600

export const isMdWidth = (): Boolean => Dimensions.get("window").width >= mdScreenWidth
export const hasMinWidth = (minWidth: number) => Dimensions.get("window").width >= minWidth