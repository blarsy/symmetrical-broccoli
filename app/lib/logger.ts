import { ApolloClient, InMemoryCache, createHttpLink, gql } from '@apollo/client'
import { logger } from 'react-native-logs'
import { graphQlApiUrl, diagnostic } from "./settings"
import * as Device from 'expo-device'
import 'react-native-get-random-values'
import uuid from 'react-native-uuid'
import secureStore from '@/lib/secureStore'

const LOG_LEVEL_STORE_KEY = 'loglevel'
export const activityId = uuid.v4()

export interface ClientLogMessage {
    accountId?: string
    message: string
    device?: string
}

const levels = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
}

const levelFromLevelCode = (code?: number): string => {
    switch(code) {
        case 0: return 'debug'
        case 1: return 'info'
        case 2: return 'warn'
        case 3: return 'error'
        default:
            throw new Error(`Unexpected log level ${code}`)
    }
}

const CREATE_CLIENT_LOG = gql`mutation CreateClientLog($accountId: UUID, $data: String, $level: Int, $activityId: String) {
    createClientLog(
      input: {accountId: $accountId, data: $data, level: $level, activityId: $activityId}
    ) {
      integer
    }
  }
  `

let globalLogger: {
    [x: string]: (...args: any[]) => void;
}

export const setOrResetGlobalLogger = async (levelCode?: number) => {
    let customFetch
    if(typeof fetch === 'undefined') {
        customFetch = require('cross-fetch')
    }
    
    const httpLink = createHttpLink({ uri: graphQlApiUrl, fetch: customFetch || undefined })
    const client = new ApolloClient({ link: httpLink , cache: new InMemoryCache() })

    const currentLevelCode = await new Number(secureStore.get(LOG_LEVEL_STORE_KEY))
    if(levelCode && currentLevelCode !== levelCode) {
        await secureStore.set(LOG_LEVEL_STORE_KEY, levelCode.toString())
    }

    const severity = levelCode ? levelFromLevelCode(levelCode.valueOf()) : ( diagnostic ? 'debug': 'error' )

    globalLogger = logger.createLogger({ transport: (p) => {
        const logData = (p.rawMsg as ClientLogMessage[])[0] as ClientLogMessage
        const data = logData.device ? `${logData.message}\nDevice ${logData.device}` : logData.message
        
        client.mutate({ mutation: CREATE_CLIENT_LOG, variables: {
            accountId: logData.accountId,
            data,
            level: p.level.severity,
            activityId
          } })
    },  levels, severity })
}

const getOrCreateGlobalLogger = async () => {
    if(!globalLogger) await setOrResetGlobalLogger()

    return globalLogger
}

const getDeviceDescriptor = () => Device.isDevice ? 
    `Brand ${Device.brand}, designName ${Device.designName}, deviceName ${Device.deviceName}, deviceYearClass ${Device.deviceYearClass}, manufacturer ${Device.manufacturer}, modelId ${Device.modelId}, modelName ${Device.modelName}, osBuildFingerprint ${Device.osBuildFingerprint}, osBuildId ${Device.osBuildId}, osInternalBuildId ${Device.osInternalBuildId}, osName ${Device.osName}, osVersion ${Device.osVersion}, platformApiLevel ${Device.platformApiLevel}, totalMemory ${Device.totalMemory}` :
    `Not a physical device`

const logGeneric = async (fn: (...args: unknown[]) => void, logData: ClientLogMessage, includeDeviceInfo: boolean = false) => {
    try {
        if(includeDeviceInfo)
            logData.device = getDeviceDescriptor()
        fn(logData)
    } catch{}

}

export const info = async (logData: ClientLogMessage, includeDeviceInfo: boolean = false) => {
    //console.log('info', logData)
    await getOrCreateGlobalLogger()
    logGeneric(globalLogger.info, logData, includeDeviceInfo)
}
export const error = async (logData: ClientLogMessage, includeDeviceInfo: boolean = false) => {
    //console.log('error', logData)
    await getOrCreateGlobalLogger()
    logGeneric(globalLogger.error, logData, includeDeviceInfo)
}
export const debug = async (logData: ClientLogMessage, includeDeviceInfo: boolean = false) => {
    //console.log('debug', logData)
    await getOrCreateGlobalLogger()
    logGeneric(globalLogger.debug, logData, includeDeviceInfo)
}
export const warn = async (logData: ClientLogMessage, includeDeviceInfo: boolean = false) => {
    //console.log('warn', logData)
    await getOrCreateGlobalLogger()
    logGeneric(globalLogger.warn, logData, includeDeviceInfo)
}

debug({ message: 'Client logging started' }, true)