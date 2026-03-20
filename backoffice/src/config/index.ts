export interface Config {
    link1Url: string
    link2Url: string
    mapsApiKey: string
    cloudinaryCloud: string
    cloudinaryUploadPreset: string
    cloudinaryRestUrl: string
    googleApiKey: string
    appleAuthRedirectUri: string
    appleServiceId: string
    graphqlUrl: string
    graphqlSsrUrl: string
    apiUrl: string
    subscriptionsUrl: string
}

const config: Config = {
  link1Url: process.env.NEXT_PUBLIC_LINK1_URL || '',
  link2Url: process.env.NEXT_PUBLIC_LINK2_URL || '',
  mapsApiKey: process.env.NEXT_PUBLIC_MAPS_API_KEY || '',
  cloudinaryCloud: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD || '',
  cloudinaryUploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '',
  cloudinaryRestUrl: process.env.NEXT_PUBLIC_CLOUDINARY_REST_URL || '',
  googleApiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '',
  appleAuthRedirectUri: process.env.NEXT_PUBLIC_APPLE_AUTH_REDIRECT_URI || '',
  appleServiceId: process.env.NEXT_PUBLIC_APPLE_SERVICE_ID || '',
  graphqlUrl: process.env.NEXT_PUBLIC_GRAPHQL_URL || '',
  graphqlSsrUrl: process.env.NEXT_PUBLIC_GRAPHQL_SSR_URL || '',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || '',
  subscriptionsUrl: process.env.NEXT_PUBLIC_SUBSCRIPTIONS_URL || '',
}

export default config