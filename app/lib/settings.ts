import { EXPO_PUBLIC_API_URL, EXPO_PUBLIC_DIAGNOSTIC } from 'react-native-dotenv'

let apiUrlInt = process.env.EXPO_PUBLIC_API_URL || EXPO_PUBLIC_API_URL
let diagnosticInt = process.env.EXPO_PUBLIC_DIAGNOSTIC || EXPO_PUBLIC_DIAGNOSTIC

export const apiUrl = apiUrlInt
export const diagnostic = diagnosticInt