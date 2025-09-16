const version = '0.9.15'
const versionCode = 152

let appSettings
if(process.env.TARGET_ENV) {
  if(process.env.TARGET_ENV.toLowerCase() === 'test') {
    //console.log('Building for test env.')
    appSettings = require('./lib/config/test.config.json')
  } else if(process.env.TARGET_ENV.toLowerCase() === 'prod') {
    //console.log('Building for production env.')
    appSettings = require('./lib/config/prod.config.json')
  } else if(process.env.TARGET_ENV.toLowerCase() === 'dev') {
    //console.log(`Building for development env.`)
    appSettings = require('./lib/config/dev.config.json')
  } else {
    //console.log(`Could not interpret TARGET ENV value ${process.env.TARGET_ENV}, then building for development env.`)
    appSettings = require('./lib/config/dev.config.json')
  }
} else {
    //console.log(`No value for TARGET ENV, then building for production env.`)
    appSettings = require('./lib/config/prod.config.json')
}

module.exports = {
  "expo": {
    "name": "Tope la",
    "slug": "tope-la",
    "scheme": "topela",
    "version": version,
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ff4401"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "usesAppleSignIn": true,
      "infoPlist": {
        "LSMinimumSystemVersion": "12.0",
        "CFBundleURLTypes": [
          {
            "CFBundleURLSchemes": ["com.googleusercontent.apps.940052967066-sc7nhl39md08efgkca8i64076i5uskic"]
          }
        ]
      },
      "supportsTablet": true,
      "googleServicesFile": "./GoogleService-Info.plist",
      "bundleIdentifier": "com.topela",
      "buildNumber": version,
      "config": {
        "googleMapsApiKey": appSettings.googleMapsApiKey
      },
      "privacyManifests": {
        "NSPrivacyAccessedAPITypes": [
          {
            "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategoryFileTimestamp",
            "NSPrivacyAccessedAPITypeReasons": [
              "C617.1"
            ]
          },
          {
            "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategorySystemBootTime",
            "NSPrivacyAccessedAPITypeReasons": [
              "35F9.1"
            ]
          },
          {
            "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategoryDiskSpace",
            "NSPrivacyAccessedAPITypeReasons": [
              "E174.1"
            ]
          },
          {
            "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategoryUserDefaults",
            "NSPrivacyAccessedAPITypeReasons": [
              "CA92.1"
            ]
          }
        ]
      }
    },
    "android": {
      "googleServicesFile": "./google-services.json",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ff4401"
      },
      "package": "com.topela",
      "versionCode": versionCode,
      "config": {
        "googleMaps": {
          "apiKey": appSettings.googleMapsApiKey
        }
      },
      "blockedPermissions": ['android.permission.READ_MEDIA_IMAGES', 'android.permission.READ_MEDIA_VIDEO']
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "extra": {
      "eas": {
        "projectId": "484b7ec5-78c2-47e0-bc80-4f9182b4916a"
      },
      "storybookEnabled": process.env.STORYBOOK_ENABLED,
      "appSettings": appSettings
    },
    "plugins": [
      "@react-native-google-signin/google-signin",
      "expo-localization",
      [
        "expo-image-picker",
        {
          "photosPermission": "Tope-là voudrait accéder à vos fichiers images pour vous permettre de choisir les photos de vos ressources, et le logo de votre activité."
        }
      ],
      "expo-secure-store",
      [
        "expo-camera",
        {
          "cameraPermission": "Tope-là voudrait accéder à votre appareil photo pour prendre des photos de vos ressources.",
          "microphonePermission": "Allow $(PRODUCT_NAME) to access your microphone",
          "recordAudioAndroid": true
        }
      ], 
      [
        "expo-location",
        {
          "locationWhenInUsePermission": "$(PRODUCT_NAME) voudrait accéder à votre position pour positionner vos ressources."
        }
      ],
      [
        "expo-build-properties",
        {
          "ios": {
            "useFrameworks": "static"
          }
        }
      ]
    ],
    "owner": "tope_la"
  }
}
