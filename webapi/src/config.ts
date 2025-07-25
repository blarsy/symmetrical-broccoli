import dotenv from 'dotenv'
import { readFile } from 'fs/promises'
import { Pool } from 'pg'

const rawConfig = dotenv.config({ path: `./.env`, debug: true })
const configFile = process.env.CONFIG_FILE || rawConfig.parsed?.CONFIG_FILE

let config: Config

const getConfig = async(): Promise<Config> => {
    if(!configFile) throw new Error('Could not find value of environment variable CONFIG_FILE.')
    if(!config) {
        config = JSON.parse(await readFile(configFile, { encoding: 'utf-8' }))
    }

    return config
}

export const getConnectionString = (config: Config) => {
    return `postgres://${config.user}:${config.dbPassword}@${config.host}:${config.port}/${config.db}`
}

export const createPool = (config: Config, appName: string) => {
    return new Pool({
        application_name: appName,
        user: config.user,
        host: config.host,
        database: config.db,
        password: config.dbPassword,
        port: config.port
    })
}

export interface RawConfig {
    backupCommand: string
    dbPassword: string
    googleApiSecret: string
    googleAuthAudience: string
    googleServiceAccount: string
    googlePrivateKey: string
    host: string
    jwtSecret: string
    jwtType: string
    logPath: string
    mailPath: string
    mailTemplatesLocation: string
    port: number
    user: string
    mailApiKey: string
    noreplyEmail: string
    production: boolean
    productName: string
    pushNotificationsUrlPrefix: string
    remoteBackupFolderName: string
    websiteUrl: string
    webAppUrl: string
    webClientUrls: string
    versions: {[version: string]: VersionSpecificRawConfig}
}

interface VersionSpecificRawConfig {
    db: string
    apiPort: number
    doNotSendMails?: boolean
}

export interface Config extends RawConfig, VersionSpecificRawConfig {
    version: string
}

export default async (version: string): Promise<Config> => {
    const rawConfig = await getConfig()

    let versionConfig
    if(version) {
        versionConfig = rawConfig.versions[version]
    } else {
        versionConfig = rawConfig.versions.default
    }

    return { ...rawConfig, ...versionConfig, ...{version} }
}

export const getCommonConfig = async (): Promise<RawConfig> => {
    const config = await getConfig()
    return config
}

export const getVersions = async () : Promise<string[]> => {
    const config = await getConfig()
    return Object.getOwnPropertyNames(config.versions)
}