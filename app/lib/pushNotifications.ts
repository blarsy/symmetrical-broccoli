import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { setNotificationHandler } from 'expo-notifications'
  
  export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
    let token
  
    if (Device.isDevice && Device.brand) {
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX
        })
      }
  
      const { status: existingStatus } = await Notifications.getPermissionsAsync()
      let finalStatus = existingStatus
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
      }
      if (finalStatus !== 'granted') {
        throw new Error('Failed to get push token for push notification!')
      }

      // When app is running, don't show the push notifications
      setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      })

      token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig!.extra!.eas.projectId
      })
      
      return token.data
    } else {
      //console.warn('Must use physical device for Push Notifications. So these are currently disabled.')
    }
  }