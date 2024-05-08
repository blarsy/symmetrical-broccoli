import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'

export const get = async (key: string): Promise<string> => {
    if(Platform.OS === 'web'){
        return AsyncStorage.getItem(key)
    } else {
        return await SecureStore.getItemAsync(key)
    }
}

export const set = async (key: string, value: string): Promise<void> => {
    if(Platform.OS === 'web'){
        await AsyncStorage.setItem(key, value)
    } else {
        await SecureStore.setItemAsync(key, value)
    }
}

export const remove = async (key: string): Promise<void> => {
    if(Platform.OS === 'web'){
        await AsyncStorage.removeItem(key)
    } else {
        await SecureStore.deleteItemAsync(key)
    }
}