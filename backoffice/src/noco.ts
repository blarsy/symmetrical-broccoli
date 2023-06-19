import { Api } from 'nocodb-sdk'
import log from './logger'
import axios from 'axios'
import { Account, Image } from './schema'

const nocoUrl = process.env.NEXT_PUBLIC_NOCO_API_URL as string
const nocoApiKey = process.env.NOCO_API_KEY as string
const projectName = process.env.NEXT_PUBLIC_NOCO_PROJET_NAME as string

const api = new Api({
    baseURL: nocoUrl,
    headers: {
      'xc-token': nocoApiKey
    },timeout: 15000
  })

export default api

const logData = (context: string, resultOrError: object, isError?: boolean) => {
  if(isError) {
    log.error(context, resultOrError)
  } else {
    log.info(`${context}. ${JSON.stringify(resultOrError)}`)
  }
}

export const list = async (tableName: string, filter?: string, fields?: string[]): Promise<any[]> => {
    try{
      const res = await api.dbTableRow.list('v1', projectName, tableName, { where: filter, fields})
      logData(`Querying ${tableName} with filter ${filter}`, res)
      return res.list
    } catch(e: any) {
      logData(`Error when querying ${tableName} with filter ${filter}`, e, true)
      throw e
    }
}

export const update = async (tableName: string, itemId: number, data: any): Promise<any> => {
  try {
    const res = await api.dbTableRow.update('v1', projectName, tableName, itemId, data)
    logData(`Updated item with id ${itemId} in ${tableName}: ${data}`, res)
  } catch(e: any) {
    logData(`Error trying to update item with id ${itemId} in ${tableName}: ${data}`, e, true)
    throw e
  }
}

export const create = async (tableName: string, data: object): Promise<any> => {
  try {
    const res = await api.dbTableRow.create('v1', projectName, tableName, data)
    logData(`Created item in ${tableName}: ${data}`, res)
    return res
  } catch(e: any) {
    logData(`Error trying to create item in ${tableName}: ${data}`, e, true)
    throw e
  }
}

export const link = async (tableName: string, sourceItemId: string, columnName: string, targetItemId: string): Promise<any> => {
  try {
    const res = await api.dbTableRow.nestedAdd('v1', projectName, 
      tableName, sourceItemId, 'hm', columnName, targetItemId)
    logData(`Linking item from ${tableName} via column ${columnName}: `, res)
    return res
  } catch(e: any) {
    logData(`Error trying to linkitem from ${tableName} via column ${columnName}: `, e, true)
    throw e
  }
}

export const uploadResourceImage = async (attachmentPath: string, account: Account, resourceId: number, fileBlob: Blob): Promise<void> => {
  const formData = new FormData()
  const logicalPath = `noco/${projectName}/${attachmentPath}`
  const resource = account.resources.find(resource => resource.id === resourceId)
  if(!resource) throw new Error(`Resource with id ${resourceId} not found.`)
  try {
    formData.append('path', fileBlob)
    const uploadRes = await axios.post(`${nocoUrl}/api/v1/db/storage/upload?path=${logicalPath}`, 
      formData, { headers: { 'xc-token': nocoApiKey } })
    if(uploadRes.data.length && uploadRes.data.length === 1) {
      await api.dbTableRow.update('v1', projectName, 'ressources', resourceId, { 
        images: [
          ... resource.images,
          {
            path: uploadRes.data[0].path,
            mimetype: fileBlob.type,
            size: fileBlob.size,
            title: fileBlob.name
          }
        ] as Image[]
       })
    } else {
      throw new Error('No file uploaded.')
    }
  } catch(e: any) {
    logData(`Error trying to upload file to ${logicalPath}`, e, true)
    throw e
  }
}

export const getOne = async (tableName: string, query: string, fields: string[]): Promise<any> => {
  try{
    const res = await api.dbTableRow.findOne('v1', projectName, tableName, { where: query, fields})
    logData(`Querying ${tableName} with filter ${query}`, res)
    return res
  } catch(e: any) {
    logData(`Error when querying ${tableName} with filter ${query}`, e, true)
    throw e
  }
}