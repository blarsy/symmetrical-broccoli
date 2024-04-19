import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Keychain from 'react-native-keychain'

export const get = async (key: string): Promise<string> => {
    if(Platform.OS === 'web'){
        return AsyncStorage.getItem(key)
    } else {
        const value = await Keychain.getGenericPassword()
        return value && value.password
    }
}

export const set = async (key: string, value: string): Promise<void> => {
    if(Platform.OS === 'web'){
        await AsyncStorage.setItem(key, value)
    } else {
        await Keychain.setGenericPassword(key, value)
    }
}

export const remove = async (key: string): Promise<void> => {
    if(Platform.OS === 'web'){
        await AsyncStorage.removeItem(key)
    } else {
        await Keychain.resetGenericPassword()
    }
}