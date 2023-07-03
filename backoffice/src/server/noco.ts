import { Api, LinkToAnotherColumnReqType, NormalColumnRequestType } from 'nocodb-sdk'
import log from './logger'
import axios from 'axios'
import { Account, Image } from '../schema'
import { randomUUID } from 'crypto'

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

const systemCols: NormalColumnRequestType[] = [
  {"column_name":"id","title":"Id","dt":"int4","dtx":"integer","rqd":true,"pk":true,"un":false,"ai":true,"cdf":null,"np":11,"ns":0,"dtxp":"11","dtxs":"","uidt":"ID"},
  {"column_name":"created_at","title":"CreatedAt","dt":"timestamp","dtx":"specificType","rqd":false,"pk":false,"un":false,"ai":false,"cdf":"now()","np":null,"ns":null,"dtxp":"","dtxs":"","uidt":"DateTime"},
  {"column_name":"updated_at","title":"UpdatedAt","dt":"timestamp","dtx":"specificType","rqd":false,"pk":false,"un":false,"ai":false,"au":true,"cdf":"now()","np":null,"ns":null,"dtxp":"","dtxs":"","uidt":"DateTime"}
]

export const ensureDataStoreCreated = async () => {
  const projects = await api.project.list()
  if(projects.list.some((proj) => proj.title === projectName)) {
    logData(`Project ${projectName} detected, starting up ...`, {})
  } else {
    try {
      await api.project.create({ title: projectName })
      const projects = await api.project.list()
      const projectInfo = projects.list.find(project => project.title === projectName)!
      const projectId = projectInfo.id!
      
      const tokenRes = await api.apiToken.create(projectId, { description: 'apps' })

      const apiInNewProject = new Api({
        baseURL: nocoUrl,
        headers: {
          'xc-token': tokenRes.token
        },timeout: 15000
      })
      const conditionsTable = await apiInNewProject.dbTable.create(projectId, { table_name: 'conditions', title:'conditions', columns: [
        { column_name: 'titre', title: 'titre', uidt: 'SingleLineText', pv: true },
        { column_name: 'description', title: 'description', uidt: 'LongText'},
        ...systemCols

      ] })
      const resourcesTable = await apiInNewProject.dbTable.create(projectId, { table_name: 'ressources', title: 'ressources', columns: [
        { column_name: 'titre', title: 'titre', uidt: 'SingleLineText', pv: true },
        { column_name: 'description', title: 'description', uidt: 'LongText'},
        { column_name: 'expiration', title: 'expiration', uidt: 'DateTime'},
        { column_name: 'images', title: 'images', uidt: 'Attachment'},
        ...systemCols,
      ]  })
      await apiInNewProject.dbTableColumn.create(resourcesTable.id!, {
          childId: conditionsTable.id!, parentId: resourcesTable.id!, title: 'conditions',
          type: 'hm', uidt: 'LinkToAnotherRecord', virtual: false
        } as LinkToAnotherColumnReqType)
      const accountsTable = await apiInNewProject.dbTable.create(projectId, { table_name: 'comptes', title: 'comptes', columns: [
        { column_name: 'nom', title: 'nom', uidt: 'SingleLineText', pv: true },
        { column_name: 'email', title: 'email', uidt: 'SingleLineText', pv: true},
        { column_name: 'hash', title: 'hash', uidt: 'SingleLineText'},
        { column_name: 'balance', title: 'balance', uidt: 'Currency'},
        ...systemCols
      ]  })
      await apiInNewProject.dbTableColumn.create(accountsTable.id!, {
        childId: resourcesTable.id!, parentId: accountsTable.id!, title: 'ressources',
        type: 'hm', uidt: 'LinkToAnotherRecord', virtual: false
      } as LinkToAnotherColumnReqType)
      await apiInNewProject.dbTableColumn.create(accountsTable.id!, {
        childId: accountsTable.id!, parentId: accountsTable.id!, title: 'comptes_liés',
        type: 'hm', uidt: 'LinkToAnotherRecord', virtual: false
      } as LinkToAnotherColumnReqType)
        } catch (e: any) {
      logData(`Error when creating project ${projectName}.`, e)
      throw e
    }
    
  }
}

const logData = (context: string, resultOrError: object, isError?: boolean) => {
  if(isError) {
    log.error(context, resultOrError)
  } else {
    log.info(`${context}. ${JSON.stringify(resultOrError)}`)
  }
}

export const list = async (tableName: string, filter?: string, fields?: string[]): Promise<any[]> => {
    try{
      const res = await api.dbTableRow.list(orgs, projectName, tableName, { where: filter, fields})
      logData(`Querying ${tableName} with filter ${filter}`, res)
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

export const uploadResourceImage = async (attachmentPath: string, account: Account, resourceId: number, fileBlobs: Blob[]): Promise<object> => {
  const formData = new FormData()
  const logicalPath = `noco/${projectName}/${attachmentPath}`
  if(!account.resources.find(resource => resource.id === resourceId)) throw new Error(`Resource with id ${resourceId} not found.`)
  const resource = await getOne('ressources', `(Id,eq,${resourceId})`, ['Id', 'images'])
  
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

export const getOne = async (tableName: string, query: string, fields: string[]): Promise<any> => {
  try{
    const res = await api.dbTableRow.findOne(orgs, projectName, tableName, { where: query, fields })
    if(!(res as any)[fields[0]]) {
      throw new Error('Not found')
    }
    logData(`Querying ${tableName} with filter ${query}`, res)
    return res
  } catch(e: any) {
    logData(`Error when querying ${tableName} with filter ${query}`, e, true)
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
    // const res = await Promise.all(
    //   data.map((item: any) => update(tableName, item.Id, item))
    // )
    const res = await api.dbTableRow.bulkUpdate(orgs, projectName, tableName, data)
    logData(`Updated objects from ${tableName}`, data)
    return res
  } catch (e: any) {
    logData(`Failed updating from ${tableName}, ${JSON.stringify(data)}`, e, true)
    throw e
  }
}