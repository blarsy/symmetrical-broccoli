import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'

export interface ISecureStore {
    get: (key: string) => Promise<string>
    set: (key: string, value: string) => Promise<void>
    remove: (key: string) => Promise<void>
}

const get = async (key: string): Promise<string> => {
    if(Platform.OS === 'web'){
        return await AsyncStorage.getItem(key) || ''
    } else {
        return await SecureStore.getItemAsync(key) || ''
    }
}

const set = async (key: string, value: string): Promise<void> => {
    if(Platform.OS === 'web'){
        await AsyncStorage.setItem(key, value)
    } else {
        await SecureStore.setItemAsync(key, value)
    }
}

const remove = async (key: string): Promise<void> => {
    if(Platform.OS === 'web'){
        await AsyncStorage.removeItem(key)
    } else {
        await SecureStore.deleteItemAsync(key)
    }
}

export default { get, set, remove } as ISecureStore