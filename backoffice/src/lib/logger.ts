import { ApolloClient, InMemoryCache, createHttpLink, gql } from '@apollo/client'
import { v4 } from 'uuid'
import getConfig from '@/config'

export const activityId = v4()

export interface ClientLogMessage {
    accountId?: string
    message: string
    device?: string
}

enum LogLevel {
    debug = 0,
    info = 1,
    warn = 2,
    error = 3,
}

const CREATE_CLIENT_LOG = gql`mutation CreateClientLog($accountId: UUID, $data: String, $level: Int, $activityId: String) {
    createClientLog(
    input: {accountId: $accountId, data: $data, level: $level, activityId: $activityId}
    ) {
    integer
    }
}`

const getDeviceDescriptor = () => window.navigator.userAgent

const log = async (level: LogLevel, logData: ClientLogMessage, version: string, includeDeviceInfo: boolean = false) => {
    try {
        if(includeDeviceInfo)
            logData.device = getDeviceDescriptor()
        const config = getConfig(version)
        const data = includeDeviceInfo ? `${logData.message}\Navigator ${getDeviceDescriptor()}` : logData.message
        const httpLink = createHttpLink({ uri: config.graphqlUrl })
        const client = new ApolloClient({ link: httpLink , cache: new InMemoryCache() })
        
        client.mutate({ mutation: CREATE_CLIENT_LOG, variables: {
            accountId: logData.accountId,
            data,
            level,
            activityId
          } })
    } catch(e) {
        console.error(`Error while logging exception: ${e}\nOriginal exception ${JSON.stringify(logData)}`)
    }
}

export const info = async (logData: ClientLogMessage, version: string, includeDeviceInfo: boolean = false) => {
    //console.log('info', logData)
    log(LogLevel.info, logData, version, includeDeviceInfo)
}
export const error = async (logData: ClientLogMessage, version: string, includeDeviceInfo: boolean = false) => {
    //console.log('error', logData)
    log(LogLevel.error, logData, version, includeDeviceInfo)
}
export const debug = async (logData: ClientLogMessage, version: string, includeDeviceInfo: boolean = false) => {
    //console.log('debug', logData)
    log(LogLevel.debug, logData, version, includeDeviceInfo)
}
export const warn = async (logData: ClientLogMessage, version: string, includeDeviceInfo: boolean = false) => {
    //console.log('warn', logData)
    log(LogLevel.warn, logData, version, includeDeviceInfo)
}