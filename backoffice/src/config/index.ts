const config = JSON.parse(process.env.NEXT_PUBLIC_CONFIG!)

export interface RawConfig {
    link1Url: string
    link2Url: string
    mapsApiKey: string
    cloudinaryCloud: string
    cloudinaryUploadPreset: string
    cloudinaryRestUrl: string
    mainVersion: string
    googleApiKey: string
    googleApiSecret: string
    appleAuthRedirectUri: string
    appleServiceId: string
    versions: {[version: string]: VersionSpecificRawConfig}
}

interface VersionSpecificRawConfig {
    graphqlUrl: string
    apiUrl: string
    subscriptionsUrl: string
}

export interface Config extends RawConfig, VersionSpecificRawConfig {
    version: string
}

export default (version?: string): Config => {
    
    let versionConfig
    if(version) {
        versionConfig = config.versions[version]
    } else {
        versionConfig = config.versions.default
    }

    return { ...config, ...versionConfig, ...{version: version || 'default'} }
}

export const getCommonConfig = (): RawConfig => config

export const getVersions = () : string[] => {
    return Object.getOwnPropertyNames(config.versions)
}