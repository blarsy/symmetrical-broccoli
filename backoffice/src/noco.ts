import { Api } from 'nocodb-sdk'
import log from './logger'
import axios from 'axios'
import { Account, Image } from './schema'
import { randomUUID } from 'crypto'

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
    return res
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

export const link = async (tableName: string, sourceItemId: number, columnName: string, targetItemId: string): Promise<any> => {
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

export const uploadResourceImage = async (attachmentPath: string, account: Account, resourceId: number, fileBlobs: Blob[]): Promise<object> => {
  const formData = new FormData()
  const logicalPath = `noco/${projectName}/${attachmentPath}`
  if(!account.resources.find(resource => resource.id === resourceId)) throw new Error(`Resource with id ${resourceId} not found.`)
  const resource = await getOne('ressources', `(Id,eq,${resourceId})`, ['images'])
  
  // some odd behavior here: JSON is returned as a string, so I parse it manually.
  resource.images = JSON.parse(resource.images)

  try {
    fileBlobs.forEach(file => {
      formData.append('files[]', file)
      logData(`Uploading file at ${logicalPath}: ${file.name}`, file)
    })

    const uploadRes = await axios.post(`${nocoUrl}/api/v1/db/storage/upload?path=${logicalPath}`, 
      formData, { headers: { 'xc-token': nocoApiKey } })
    
    if(uploadRes.data.length && uploadRes.data.length > 0) {
      const images = [
        ...(resource.images ? resource.images : []),
        ...uploadRes.data.map((fileBlob:any, idx: number) => ({
          path: fileBlob.path,
          mimetype: fileBlob.mimetype,
          size: fileBlob.size,
          title: randomUUID().toString()
        }))
      ] as Image[]

      const res = await api.dbTableRow.update('v1', projectName, 'ressources', resourceId, { images })
      logData(`Linking ${uploadRes.data.length} images at ${logicalPath} to resource with id ${resourceId}. Full image list: ${images}`, {})
      return res
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
    const res = await api.dbTableRow.findOne('v1', projectName, tableName, { where: query, fields })
    logData(`Querying ${tableName} with filter ${query}`, res)
    return res
  } catch(e: any) {
    logData(`Error when querying ${tableName} with filter ${query}`, e, true)
    throw e
  }
}