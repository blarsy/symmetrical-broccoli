import { NavigationHelpers, ParamListBase } from "@react-navigation/native"
import { Dimensions } from "react-native"
import { Location, Message } from "./schema"
import { ApolloError, gql } from "@apollo/client"
import { getLocales } from "expo-localization"
import { MediaTypeOptions, launchImageLibraryAsync, requestMediaLibraryPermissionsAsync } from "expo-image-picker"
import { ImageResult, manipulateAsync } from "expo-image-manipulator"
import Constants from 'expo-constants'
import { compareVersions } from "compare-versions"
import { nativeApplicationVersion } from 'expo-application'
import dayjs from "dayjs"
import { t } from "@/i18n"
import { configureFonts, DefaultTheme } from "react-native-paper"
import { useFonts } from 'expo-font'
import { ThemeProp } from "react-native-paper/lib/typescript/types"

export const isValidPassword = (password?: string) => !!password && password.length > 7 && !!password.match(/[A-Z]/) && !!password.match(/[^A-Z]/)

export interface RouteProps {
    route: { name: string, params: any }, 
    navigation: NavigationHelpers<ParamListBase>
}

export const mdScreenWidth = 600
export const appBarsTitleFontSize = 36

export const aboveMdWidth = (): Boolean => Dimensions.get("window").width >= mdScreenWidth
export const hasMinWidth = (minWidth: number) => Dimensions.get("window").width >= minWidth
export const percentOfWidth = (percent: number) => Dimensions.get('window').width / 100 * percent

export const fontSizeLarge = aboveMdWidth() ? 24 : 20
export const fontSizeMedium = aboveMdWidth() ? 20 : 16
export const fontSizeSmall = aboveMdWidth() ? 18 : 14

export enum ScreenSize {
    sm,
    md,
    lg
}

export const MAX_DISTANCE = 50

export const getTheme = (): ThemeProp => ({
  fonts: configureFonts({ config: { 
      bodyLarge: { fontFamily: 'Futura-std-heavy', fontSize: fontSizeLarge, lineHeight: fontSizeLarge * 1.2 },
      bodyMedium: { fontFamily: 'Futura-std-heavy', fontSize: fontSizeMedium, lineHeight: fontSizeMedium * 1.2 },
      bodySmall: { fontFamily: 'Futura-std-heavy', fontSize: fontSizeSmall, lineHeight: fontSizeSmall * 1.2},
      displayLarge: { fontFamily: 'Futura-std-heavy', fontSize: fontSizeLarge, lineHeight: fontSizeLarge * 1.2},
      displayMedium: { fontFamily: 'Futura-std-heavy', fontSize: fontSizeMedium, lineHeight: fontSizeMedium * 1.2},
      displaySmall: { fontFamily: 'Futura-std-heavy', fontSize: fontSizeSmall, lineHeight: fontSizeSmall * 1.2},
      headlineLarge: { fontFamily: 'DK-magical-brush', fontSize: fontSizeLarge, lineHeight: fontSizeLarge * 1.2},
      headlineMedium: { fontFamily: 'DK-magical-brush', fontSize: fontSizeMedium, lineHeight: fontSizeMedium * 1.2},
      headlineSmall: { fontFamily: 'DK-magical-brush', fontSize: fontSizeSmall, lineHeight: fontSizeSmall * 1.2},
      labelLarge: { fontFamily: 'DK-magical-brush', fontSize: fontSizeLarge, lineHeight: fontSizeLarge * 1.2},
      labelMedium: { fontFamily: 'DK-magical-brush', fontSize: fontSizeMedium, lineHeight: fontSizeMedium * 1.2},
      labelSmall: { fontFamily: 'DK-magical-brush', fontSize: fontSizeSmall, lineHeight: fontSizeSmall * 1.2},
      titleLarge: { fontFamily: 'DK-magical-brush', fontSize: fontSizeLarge, lineHeight: fontSizeLarge * 1.2 },
      titleMedium: { fontFamily: 'DK-magical-brush', fontSize: fontSizeMedium, lineHeight: fontSizeMedium * 1.2 },
      titleSmall: { fontFamily: 'DK-magical-brush', fontSize: fontSizeSmall, lineHeight: fontSizeSmall * 1.2 }
  } }),
  colors: {
    ...DefaultTheme.colors,
    backdrop: 'rgba(227,94,30,0.3)'
  }
})

export const getScreenSize = (): ScreenSize => {
    if(aboveMdWidth()){
        if(hasMinWidth(900)) {
            return ScreenSize.lg
        }
        return ScreenSize.md
    } else {
        return ScreenSize.sm
    }
}

export function adaptToWidth<T> (sm: T, md: T, lg: T):T {
  switch(getScreenSize()) {
    case ScreenSize.sm: return sm
    case ScreenSize.md: return md
    case ScreenSize.lg: return lg
  }
}

export interface NewMessageData {
    message: Message
    resourceId: number
}

export interface LoadState {
    data: any
    loading: boolean
    error: ApolloError | undefined
}

export const adaptHeight = (sm: number, md: number, lg: number):number => {
    const screenHeight = Dimensions.get("window").height
    if(screenHeight < 400) return sm
    if(screenHeight < 1000) return md
    return lg
}

export const apolloTokenExpiredHandler = {
  handle: () => {
    // It is not the intention that this code executes, it should have been replaced by another function that does more sound things,
    // such as clearing local storage of the stale or invalid token
    console.log('Token expired or invalid')
  }
}

export const errorToString = (e: Error) => `message: ${e.message}, name: ${e.name}, ${e.stack && `, stack: ${e.stack}`}`


let language: string | undefined = undefined
export const getLanguage = (): string => {
  if(!language) {
      if (Constants.expoConfig?.extra?.storybookEnabled === "true") {
        return 'fr'
      }

      const supportedLanguages = ['fr', 'en']
      const deviceLocales = getLocales()
    
      // find the first supported language that is also installed on the device
      const firstCompatibleLanguage = supportedLanguages.find(supportedLanguage => deviceLocales.some && deviceLocales.some(deviceLocale => deviceLocale.languageCode?.toLowerCase() === supportedLanguage))
      
      // If the device is not installed with any comptible language, default to the first supported language
      language = firstCompatibleLanguage || supportedLanguages[0]
  }
  return language
}        

export const pickImage = async (success: ((img: ImageResult)=> void), height: number) => {
    await requestMediaLibraryPermissionsAsync(true)
    let result = await launchImageLibraryAsync({
        mediaTypes: MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
    })
    
    if(!result.canceled && result.assets.length > 0) {
        const img = await manipulateAsync(result.assets[0].uri, [{ resize: { height }}])

        success(img)
    }
}             

export const GET_RESOURCE = gql`query GetResource($id: Int!) {
  resourceById(id: $id) {
    accountByAccountId {
      email
      id
      name
      imageByAvatarImageId {
        publicId
      }
    }
    canBeDelivered
    canBeExchanged
    canBeGifted
    canBeTakenAway
    description
    id
    isProduct
    isService
    expiration
    title
    resourcesResourceCategoriesByResourceId {
      nodes {
        resourceCategoryCode
      }
    }
    resourcesImagesByResourceId {
      nodes {
        imageByImageId {
          publicId
        }
      }
    }
    locationBySpecificLocationId {
      address
      latitude
      longitude
      id
    }
    created
    deleted
  }
}`

export const initials = (text: string) => {
  if(text)
      return text.split(' ').map(word => word[0]?.toLocaleUpperCase()).slice(0, 2).join('')

  return ""
}

export const versionChecker = (serverVersion: string) => {
  if(nativeApplicationVersion === 'mock') return true

  if(nativeApplicationVersion)
    return compareVersions(nativeApplicationVersion, serverVersion) >= 0
  
  return true
}

export const userFriendlyTime = (time: Date) => {
  const djTime = dayjs.utc(time)
  const millisecondsEllapsed = Math.abs(djTime.diff())
  const epoch = time.valueOf()
  
  if(millisecondsEllapsed < 10 * 60 * 1000)
    return djTime.local().fromNow()
  else if (millisecondsEllapsed < Math.abs(djTime.startOf('day').diff(djTime))) {
    return djTime.local().format('HH:mm')
  } else if (epoch > dayjs().startOf('day').valueOf() - (6 * 24 * 60 * 60 * 1000)) {
    return djTime.local().format('ddd')
  } else if(epoch > dayjs().startOf('day').valueOf() - (364 * 24 * 60 * 60 * 1000)) {
    return djTime.local().format(t('shortDateFormat'))
  } else {
    return djTime.local().format('MMM YY')
  }
}

export const useCustomFonts = () => useFonts({
  'DK-magical-brush': require('@/assets/fonts/dk-magical-brush.otf'),
  'Futura-std-heavy': require('@/assets/fonts/futura-std-heavy.otf')
})

export const regionFromLocation = (loc : Location) => ({
  latitudeDelta: 0.005,
  longitudeDelta: 0.005,
  longitude: loc.longitude,
  latitude: loc.latitude
})