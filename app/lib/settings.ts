import { isTesting } from '@/tests/util'
import Constants from 'expo-constants'

let config

if(isTesting()) {
    config = {
        apiUrl: "http://localhost:3001",
        graphQlApiUrl: "http://localhost:3001/graphql",
        subscriptionsUrl: "ws://localhost:3001/graphql",
        linksUrl: "http://localhost:3002/api/link/",
        cloudinaryCloud: "dsgfeclck",
        cloudinaryUploadPreset: "ecibpquo",
        cloudinaryRestUrl: "https://api.cloudinary.com/v1_1/",
        clientVersion: "0.6.0",
        googleMapsApiKey: "AIzaSyBfDiyPA7g9_qtda_t9foXartoC14kBoDI",
        googleAuthWebClienttId: "940052967066-3ct1ie7kurg1alpf0dlr5fvfqckj0gqd.apps.googleusercontent.com",
        diagnostic: true
    }
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

