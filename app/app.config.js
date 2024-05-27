const version = '0.2.0'
const versionCode = 95

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
      "supportsTablet": true,
      "bundleIdentifier": "com.topela",
      "buildNumber": version,
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
      "versionCode": versionCode
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "extra": {
      "eas": {
        "projectId": "484b7ec5-78c2-47e0-bc80-4f9182b4916a"
      },
      "storybookEnabled": process.env.STORYBOOK_ENABLED
    },
    "plugins": [
      "expo-localization",
      [
        "expo-image-picker",
        {
          "photosPermission": "Tope-là voudrait accéder à vos fichiers images pour vous permettre de choisir les photos de vos ressources, et le logo de votre activité."
        }
      ],
      "expo-secure-store"
    ],
    "owner": "tope_la"
  }
}
