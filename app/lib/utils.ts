import { NavigationHelpers, ParamListBase } from "@react-navigation/native"
import { Dimensions } from "react-native"
import { Location, Message } from "./schema"
import { ApolloError, gql } from "@apollo/client"
import { getLocales } from "expo-localization"
import { launchImageLibraryAsync, requestMediaLibraryPermissionsAsync } from "expo-image-picker"
import { ImageManipulator, ImageResult } from "expo-image-manipulator"
import Constants from 'expo-constants'
import { compareVersions } from "compare-versions"
import { nativeApplicationVersion } from 'expo-application'
import dayjs from "dayjs"
import { t } from "@/i18n"
import { configureFonts, DefaultTheme } from "react-native-paper"
import { useFonts } from 'expo-font'
import { ThemeProp } from "react-native-paper/lib/typescript/types"
import { info } from "./logger"
import { lightPrimaryColor } from "@/components/layout/constants"

export const isValidPassword = (password?: string) => !!password && password.length > 7 && !!password.match(/[A-Z]/) && !!password.match(/[^A-Z]/)

export interface RouteProps {
    route: { name: string, params: any }, 
    navigation: NavigationHelpers<ParamListBase>
}

export const DEFAUT_LOCATION: Location = {
    latitude: 50.6058984,
    longitude: 3.3881915,
    address: ''
}

export const STANDARD_APPBAR_TITLE_FONTSIZE = 36
export const mdScreenWidth = 600
let appBarsTitleFontSize: number | undefined = undefined

export const aboveMdWidth = (): Boolean => Dimensions.get("window").width >= mdScreenWidth
export const hasMinWidth = (minWidth: number) => Dimensions.get("window").width >= minWidth
export const percentOfWidth = (percent: number) => Dimensions.get('window').width / 100 * percent
export const getAppBarsTitleFontSize = () => {
  if(!appBarsTitleFontSize) {
    appBarsTitleFontSize = Dimensions.get("window").width < 400 ? 30 : STANDARD_APPBAR_TITLE_FONTSIZE
  }
  return appBarsTitleFontSize
}

export const fontSizeLarge = aboveMdWidth() ? 24 : 20
export const fontSizeMedium = aboveMdWidth() ? 20 : 16
export const fontSizeSmall = aboveMdWidth() ? 18 : 14

export enum ScreenSize {
    sm,
    md,
    lg
}

export const MAX_DISTANCE = 50
export const SMALL_IMAGEBUTTON_SIZE = 30

export const getTheme = (): ThemeProp => ({
  fonts: configureFonts({ config: { 
      bodyLarge: { fontFamily: 'text', fontSize: fontSizeLarge, lineHeight: fontSizeLarge * 1.2 },
      bodyMedium: { fontFamily: 'text', fontSize: fontSizeMedium, lineHeight: fontSizeMedium * 1.2 },
      bodySmall: { fontFamily: 'text', fontSize: fontSizeSmall, lineHeight: fontSizeSmall * 1.2},
      displayLarge: { fontFamily: 'text', fontSize: fontSizeLarge, fontWeight: '800', lineHeight: fontSizeLarge * 1.2},
      displayMedium: { fontFamily: 'text', fontSize: fontSizeMedium, fontWeight: '800', lineHeight: fontSizeMedium * 1.2},
      displaySmall: { fontFamily: 'text', fontSize: fontSizeSmall, fontWeight: '800', lineHeight: fontSizeSmall * 1.2},
      headlineLarge: { fontFamily: 'title', fontSize: fontSizeLarge, lineHeight: fontSizeLarge * 1.2},
      headlineMedium: { fontFamily: 'title', fontSize: fontSizeMedium, lineHeight: fontSizeMedium * 1.2},
      headlineSmall: { fontFamily: 'title', fontSize: fontSizeSmall, lineHeight: fontSizeSmall * 1.2},
      labelLarge: { fontFamily: 'title', fontSize: fontSizeLarge, lineHeight: fontSizeLarge * 1.2},
      labelMedium: { fontFamily: 'title', fontSize: fontSizeMedium, lineHeight: fontSizeMedium * 1.2},
      labelSmall: { fontFamily: 'title', fontSize: fontSizeSmall, lineHeight: fontSizeSmall * 1.2},
      titleLarge: { fontFamily: 'title', fontSize: fontSizeLarge, lineHeight: fontSizeLarge * 1.2 },
      titleMedium: { fontFamily: 'title', fontSize: fontSizeMedium, lineHeight: fontSizeMedium * 1.2 },
      titleSmall: { fontFamily: 'title', fontSize: fontSizeSmall, lineHeight: fontSizeSmall * 1.2 }
  } }),
  colors: {
    ...DefaultTheme.colors,
    secondaryContainer: lightPrimaryColor,
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
        mediaTypes: [ 'images' ],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
    })
    
    if(!result.canceled && result.assets.length > 0) {
        const ctx = ImageManipulator.manipulate(result.assets[0].uri)
        ctx.resize({ height, width: height })
        const imgRef = await ctx.renderAsync()
        const img = await imgRef.saveAsync()
        
        success(img)
    }
}

export const cropImageCenterVertically = async (uri: string, size: number, currentHeight: number, currentWidth: number) => {
  info({ message: `manipulations on ${JSON.stringify({uri, currentHeight, currentWidth})} : ${JSON.stringify([
    { crop: {  originX: 0, originY: ((currentHeight - currentWidth) / 2), width: currentWidth, height: currentWidth }},
    { resize: { height: size, width: size } }
  ])}` })
  const ctx = ImageManipulator.manipulate(uri)
  ctx.crop({  originX: 0, originY: ((currentHeight - currentWidth) / 2), width: currentWidth, height: currentWidth })
  ctx.resize({ height: size, width: size })
  const imgRef = await ctx.renderAsync()
  return await imgRef.saveAsync()
  // return await manipulateAsync(uri, [
  //   { crop: {  originX: 0, originY: ((currentWidth - currentHeight) / 2), width: currentHeight, height: currentHeight }},
  //   { resize: { height: size, width: size } }
  // ])
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
    price
    campaignsResourcesByResourceId {
      nodes {
        campaignId
      }
    }
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
  const epoch = djTime.valueOf()

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
  //'title': require('@/assets/fonts/Bruta-Sans.ttf'),
  'title': require('@/assets/fonts/LTMakeup-Regular.otf'),
  'text': require('@/assets/fonts/renner-book.otf')
})

export const regionFromLocation = (loc : Location) => ({
  latitudeDelta: 0.005,
  longitudeDelta: 0.005,
  longitude: loc.longitude,
  latitude: loc.latitude
})

export const daysFromNow = (days: number) => new Date(new Date().valueOf() + days * 24 * 60 * 60 * 1000)

export enum AuthProviders {
  google = 0,
  apple = 1
}