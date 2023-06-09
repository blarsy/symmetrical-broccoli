import { Api } from 'nocodb-sdk'
import log from './logger'

const api = new Api({
    baseURL: process.env.NOCO_API_URL,
    headers: {
      'xc-token': process.env.NOCO_API_KEY
    },timeout: 15000
  })
export default api

const logData = (context: string, result: object) => {
  log.info(`${context}. ${JSON.stringify(result)}`)
}

export const list = async (tableName: string, filter?: string): Promise<any[]> => {
    try{
      const res = await api.dbTableRow.list('v1', process.env.NOCO_PROJET_NAME as string, tableName, { where: filter})
      logData(`Querying ${tableName} with filter ${filter}`, res)
      return res.list
    } catch(e: any) {
      logData(`Error when querying ${tableName} with filter ${filter}`, e)
      throw e
    }
}

export const create = async (tableName: string, data: object): Promise<void> => {
  try {
    const res = await api.dbTableRow.create('v1', process.env.NOCO_PROJET_NAME as string, tableName, data)
    logData(`Created item in ${tableName}: ${data}`, res)
  } catch(e: any) {
    logData(`Error trying to create item in ${tableName}: ${data}`, e)
    throw e
  }
}