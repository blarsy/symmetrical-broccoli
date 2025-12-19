import { isTesting } from '@/tests/util'
import Constants from 'expo-constants'
import testSettings from '@/lib/config/dev.config.json'

let config

if(isTesting()) {
    config = testSettings
} else {
    config = {
        apiUrl: Constants.expoConfig!.extra!.appSettings.apiUrl,
        appleAuthRedirectUri: Constants.expoConfig!.extra!.appSettings.appleAuthRedirectUri,
        appleServiceId: Constants.expoConfig!.extra!.appSettings.appleServiceId,
        graphQlApiUrl: Constants.expoConfig!.extra!.appSettings.graphQlApiUrl,
        subscriptionsUrl: Constants.expoConfig!.extra!.appSettings.subscriptionsUrl,
        linksUrl: Constants.expoConfig!.extra!.appSettings.linksUrl,
        cloudinaryCloud: Constants.expoConfig!.extra!.appSettings.cloudinaryCloud,
        cloudinaryUploadPreset: Constants.expoConfig!.extra!.appSettings.cloudinaryUploadPreset,
        cloudinaryRestUrl: Constants.expoConfig!.extra!.appSettings.cloudinaryRestUrl,
        googleMapsApiKey: Constants.expoConfig!.extra!.appSettings.googleMapsApiKey,
        googleAuthWebClienttId: Constants.expoConfig!.extra!.appSettings.googleAuthWebClienttId,
        googleAuthIOSClientID: Constants.expoConfig!.extra!.appSettings.googleAuthIOSClientID,
        diagnostic: Constants.expoConfig!.extra!.appSettings.diagnostic
    }
}

export const apiUrl = config.apiUrl
export const appleServiceId = config.appleServiceId
export const appleAuthRedirectUri = config.appleAuthRedirectUri
export const graphQlApiUrl = config.graphQlApiUrl
export const subscriptionsUrl = config.subscriptionsUrl
export const linksUrl = config.linksUrl
export const cloudinaryCloud = config.cloudinaryCloud
export const cloudinaryUploadPreset = config.cloudinaryUploadPreset
export const cloudinaryRestUrl = config.cloudinaryRestUrl
export const googleMapsApiKey = config.googleMapsApiKey
export const googleAuthWebClienttId = config.googleAuthWebClienttId
export const googleAuthIOSClientID = config.googleAuthIOSClientID
export const diagnostic = config.diagnostic

export const ADD_LOGO_REWARD = 20
export const ADD_LOCATION_REWARD = 20
export const ADD_LINK_REWARD = 20
export const ADD_RESOURCE_PICTURE_REWARD = 5
export const ADD_RESOURCE_PRICE_REWARD = 15
export const CREATE_RESOURCE_REWARD = 20