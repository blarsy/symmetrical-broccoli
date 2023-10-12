import { Api, RequestParams } from 'nocodb-sdk'
import { logData } from './logger'
import axios from 'axios'
import { Account, Image } from '../schema'
import { randomUUID } from 'crypto'
import { readFile } from 'fs/promises'
import { ensureDataStoreUptodate } from './databaseMaintenance'

const nocoUrl = process.env.NEXT_PUBLIC_NOCO_API_URL as string
const nocoApiKey = process.env.NOCO_API_KEY as string
const projectName = process.env.NEXT_PUBLIC_NOCO_PROJET_NAME as string
const orgs = 'v1'

const api = new Api({
    baseURL: nocoUrl,
    headers: {
      'xc-token': nocoApiKey
    },timeout: 15000
  })

export const ensureDbUpToDate = async (): Promise<string> => {
  return ensureDataStoreUptodate(api, projectName, orgs, nocoUrl)
}

export const remove = async (tableName: string, itemId: string): Promise<number> => {
  try{
    const res = await api.dbTableRow.delete(orgs, projectName, tableName, itemId)
    logData(`Deleted from ${tableName}, Id ${itemId}`, { res })
    return res
  } catch(e: any) {
    logData(`Error when deleting from ${tableName} at Id ${itemId}`, e, true)
    throw e
  }
}

export const list = async (tableName: string, filter?: string, fields?: string[], otherParams?: RequestParams): Promise<any[]> => {
    try{
      const res = await api.dbTableRow.list(orgs, projectName, tableName, { where: filter, fields }, otherParams)
      logData(`Querying ${tableName} with filter ${filter} ${otherParams && 'other params: ' + JSON.stringify(otherParams)}`, res)
      return res.list
    } catch(e: any) {
      logData(`Error when querying ${tableName} with filter ${filter}`, e, true)
      throw e
    }
}

export const update = async (tableName: string, itemId: number, data: any): Promise<any> => {
  try {
    const res = await api.dbTableRow.update(orgs, projectName, tableName, itemId, data)
    logData(`Updated item with id ${itemId} in ${tableName}: ${data}`, res)
    return res
  } catch(e: any) {
    logData(`Error trying to update item with id ${itemId} in ${tableName}: ${JSON.stringify(data)}`, e, true)
    throw e
  }
}

export const bulkCreate = async (tableName: string, data: object[]): Promise<any> => {
  try {
    const res = await api.dbTableRow.bulkCreate(orgs, projectName, tableName, data)
    logData(`Created items in ${tableName}: ${JSON.stringify(data)}`, res)
    return res
  } catch (e: any) {
    logData(`Error trying to create items in ${tableName}: ${JSON.stringify(data)}`, e, true)
    throw e
  }
}

export const create = async (tableName: string, data: object): Promise<any> => {
  try {
    const res = await api.dbTableRow.create(orgs, projectName, tableName, data)
    logData(`Created item in ${tableName}: ${JSON.stringify(data)}`, res)
    return res
  } catch(e: any) {
    logData(`Error trying to create item in ${tableName}: ${JSON.stringify(data)}`, e, true)
    throw e
  }
}

export const link = async (tableName: string, sourceItemId: number, columnName: string, targetItemId: string): Promise<any> => {
  try {
    const res = await api.dbTableRow.nestedAdd(orgs, projectName, 
      tableName, sourceItemId, 'hm', columnName, targetItemId)
    logData(`Linking item from ${tableName} via column ${columnName}: `, res)
    return res
  } catch(e: any) {
    logData(`Error trying to link item from ${tableName} via column ${columnName}: `, e, true)
    throw e
  }
}

export const unlink = async (tableName: string, sourceItemId: number, columnName: string, targetItemId: string): Promise<any> => {
  try {
    const res = await api.dbTableRow.nestedRemove(orgs, projectName, 
      tableName, sourceItemId, 'hm', columnName, targetItemId)
    logData(`Unlinking item from ${tableName} via column ${columnName}: `, res)
    return res
  } catch(e: any) {
    logData(`Error trying to unlink item from ${tableName} via column ${columnName}: `, e, true)
    throw e
  }
}

export const uploadResourceImage = async (attachmentPath: string, account: Account, resourceId: number, filePaths: string[]): Promise<any> => {
  const formData = new FormData()
  const logicalPath = `noco/${projectName}/${attachmentPath}`
  if(!account.resources || !account.resources.find(resource => resource.id === resourceId)) throw new Error(`Resource with id ${resourceId} not found.`)
  const resource = await getOne('ressources', `(Id,eq,${resourceId})`, ['Id', 'images'])
  
  // some odd behavior here: JSON is returned as a string, so I parse it manually.
  resource.images = JSON.parse(resource.images)

  try {
    const promises = filePaths.map(async filePath => {
      formData.append('files[]', new Blob([await readFile(filePath)]))
      logData(`Uploading file at ${logicalPath}: ${filePath}`, {})
    })

    await Promise.all(promises)

    const uploadRes = await axios.post(`${nocoUrl}/api/v1/db/storage/upload?path=${logicalPath}`, 
      formData, { headers: { 'xc-token': nocoApiKey } })
    
    if(uploadRes.data.length && uploadRes.data.length > 0) {
      const images = [
        ...(resource.images ? resource.images : []),
        ...uploadRes.data.map((fileBlob:any) => ({
          path: fileBlob.path,
          mimetype: fileBlob.mimetype,
          size: fileBlob.size,
          title: randomUUID().toString()
        }))
      ] as Image[]

      const res = await api.dbTableRow.update(orgs, projectName, 'ressources', resourceId, { images })
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

export const getOne = async (tableName: string, query: string, fields: string[], otherParams?: RequestParams): Promise<any> => {
  try{
    const res = await api.dbTableRow.findOne(orgs, projectName, tableName, { where: query, fields }, otherParams)
    if(!(res as any)[fields[0]]) {
      throw new Error('Not found')
    }
    logData(`Querying ${tableName} with filter ${query} ${otherParams ? 'other params : ' + JSON.stringify(otherParams) : ''}`, res)
    return res
  } catch(e: any) {
    logData(`Error when querying ${tableName} with filter ${query} ${otherParams ? 'other params : ' + JSON.stringify(otherParams) : ''}`, e, true)
    throw e
  }
}

export const getChildItems = async (tableName: string, parentItemId: number, columnName: string): Promise<any[]> => {
  try {
    const res = await api.dbTableRow.nestedList(orgs, projectName, tableName, parentItemId, "hm", columnName)
    logData(`Querying child list from ${tableName}, parent item id ${parentItemId}, column ${columnName}`, res)
    return res.list
  } catch(e: any) {
    logData(`Querying child list from ${tableName}, parent item id ${parentItemId}, column ${columnName}`, e, true)
    throw e
  }
}

export const bulkDelete = async (tableName: string, objectsToDelete: any[]): Promise<void> => {
  try {
    await api.dbTableRow.bulkDelete(orgs, projectName, tableName, objectsToDelete)
    logData(`Deleted objects from ${tableName}`, objectsToDelete)
  } catch (e: any) {
    logData(`Failed deleting from ${tableName}, ${JSON.stringify(objectsToDelete)}`, e, true)
    throw e
  }
}

export const bulkUpdate = async (tableName: string, data: any[]): Promise<any[]> => {
  try {
    const res = await api.dbTableRow.bulkUpdate(orgs, projectName, tableName, data)
    logData(`Updated objects from ${tableName}`, data)
    return res
  } catch (e: any) {
    logData(`Failed updating from ${tableName}, ${JSON.stringify(data)}`, e, true)
    throw e
  }
}