import { isTesting } from '@/tests/util'
import Constants from 'expo-constants'
import testSettings from '@/lib/config/dev.config.json'

let config

if(isTesting()) {
    config = testSettings
} else {
    config = {
        apiUrl: Constants.expoConfig!.extra!.appSettings.apiUrl,
        graphQlApiUrl: Constants.expoConfig!.extra!.appSettings.graphQlApiUrl,
        subscriptionsUrl: Constants.expoConfig!.extra!.appSettings.subscriptionsUrl,
        linksUrl: Constants.expoConfig!.extra!.appSettings.linksUrl,
        cloudinaryCloud: Constants.expoConfig!.extra!.appSettings.cloudinaryCloud,
        cloudinaryUploadPreset: Constants.expoConfig!.extra!.appSettings.cloudinaryUploadPreset,
        cloudinaryRestUrl: Constants.expoConfig!.extra!.appSettings.cloudinaryRestUrl,
        clientVersion: Constants.expoConfig!.extra!.appSettings.clientVersion,
        googleMapsApiKey: Constants.expoConfig!.extra!.appSettings.googleMapsApiKey,
        googleAuthWebClienttId: Constants.expoConfig!.extra!.appSettings.googleAuthWebClienttId,
        diagnostic: Constants.expoConfig!.extra!.appSettings.diagnostic
    }
}

export const apiUrl = config.apiUrl
export const graphQlApiUrl = config.graphQlApiUrl
export const subscriptionsUrl = config.subscriptionsUrl
export const linksUrl = config.linksUrl
export const cloudinaryCloud = config.cloudinaryCloud
export const cloudinaryUploadPreset = config.cloudinaryUploadPreset
export const cloudinaryRestUrl = config.cloudinaryRestUrl
export const clientVersion = config.clientVersion
export const googleMapsApiKey = config.googleMapsApiKey
export const googleAuthWebClienttId = config.googleAuthWebClienttId
export const diagnostic = config.diagnostic

