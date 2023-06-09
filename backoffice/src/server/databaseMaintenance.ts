import { NormalColumnRequestType, Api, LinkToAnotherColumnReqType } from "nocodb-sdk"
import { logData } from "./logger"
import { answerInvite, create, invite } from "./dal/user"
import { create as createResource} from './dal/resource'

const systemTableName = 'systeme'
const accountsTableName = 'comptes'

const systemCols: NormalColumnRequestType[] = [
    {"column_name":"id","title":"Id","dt":"int4","dtx":"integer","rqd":true,"pk":true,"un":false,"ai":true,"cdf":null,"np":11,"ns":0,"dtxp":"11","dtxs":"","uidt":"ID"},
    {"column_name":"created_at","title":"CreatedAt","dt":"timestamp","dtx":"specificType","rqd":false,"pk":false,"un":false,"ai":false,"cdf":"now()","np":null,"ns":null,"dtxp":"","dtxs":"","uidt":"DateTime"},
    {"column_name":"updated_at","title":"UpdatedAt","dt":"timestamp","dtx":"specificType","rqd":false,"pk":false,"un":false,"ai":false,"au":true,"cdf":"now()","np":null,"ns":null,"dtxp":"","dtxs":"","uidt":"DateTime"}
  ]
  
const getProjectId = async (api: Api<unknown>, projectName: string): Promise<string> => {
    const projects = await api.project.list()
    const projectInfo = projects.list.find(project => project.title === projectName)!
    return projectInfo.id!
}

const createInitial = async (api: Api<unknown>, projectName: string, nocoUrl: string, orgs: string) => {
    await api.project.create({ title: projectName })
    const projectId = await getProjectId(api, projectName)

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
    const accountsTable = await apiInNewProject.dbTable.create(projectId, { table_name: accountsTableName, title: accountsTableName, columns: [
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
        type: 'mm', uidt: 'LinkToAnotherRecord', virtual: false
    } as LinkToAnotherColumnReqType)
    await migrateToV1_0_0(apiInNewProject, projectId, orgs, projectName)
}

const migrateToV1_0_0 = async (api: Api<unknown>, projectId: string, orgs: string, projectName: string): Promise<void> => {
    await api.dbTable.create(projectId, { table_name: systemTableName, title: systemTableName, columns: [
        ...systemCols,
        { column_name: 'version', title: 'version', uidt: 'SingleLineText'}
    ]  })
    await api.dbTableRow.create(orgs, projectName, systemTableName, { version: '1.0.0' })

    const accountsTableId = await getTableId(api, projectId, accountsTableName)
    await api.dbTableColumn.create(accountsTableId, {
        childId: accountsTableId, parentId: accountsTableId, title: 'comptes_invites',
        type: 'mm', uidt: 'LinkToAnotherRecord', virtual: false
    } as LinkToAnotherColumnReqType)
}
 
const insertTestData  = async () => {
    if(process.env.NODE_ENV === 'development') {
        const accounts = await Promise.all([
            create('Bertrand', 'bertrand.larsy@gmail.com', 'password'),
            create('Silex', 'info@silex.be', 'password'),
            create('Collectif Garage', 'info@garage.be', 'password')
        ])
        await Promise.all([
            createResource(accounts[0].id, 'Matelas 2 personnes', 'Double emploi', new Date(new Date().valueOf() + (10 * 24 * 60 * 60 * 1000)), []),
            createResource(accounts[0].id, 'Pigments peinture argile', 'Restes de mes travaux. Jaune, bleu, vert.', new Date(new Date().valueOf() + (8 * 24 * 60 * 60 * 1000)), [
                { title: 'Retrait sur place', description: 'Pas de livraison' },
                { title: 'Prix fixe', description: 'Pas de négociations, on ne répondra pas aux offres plus basses que le prix demandé.'}
            ]),
            createResource(accounts[1].id, 'Bois de chauffe', 'Une stère de bois mélangé bouleau, peuplier et érable.', new Date(new Date().valueOf() + (5 * 24 * 60 * 60 * 1000)), []),
            invite(accounts[0].email, accounts[1].id.toString())
        ])
        return Promise.all([
            answerInvite(accounts[1].email, accounts[0].id.toString(), true)
        ])
    }
}

const ensureMigrationApplied = async (api: Api<unknown>, projectName: string, orgs: string): Promise<string> => {
    const projectId = await getProjectId(api, projectName)
    const tables = await api.dbTable.list(projectId)
    if(tables.list.some((table) => table.title === systemTableName)) {
        // nothing for the moment, future migrations will be called from here
        return 'Db up to date'
    } else {
        await migrateToV1_0_0(api, projectId, orgs, projectName)
        return 'Migrated to 1.0.0'
    }
}

const getTableId = async (api: Api<unknown>, projectId: string, tableName: string): Promise<string> => {
    const tables = await api.dbTable.list(projectId)
    const table = tables.list.find(table => table.title === tableName)
    if(!table) throw new Error(`table ${table} not found`)

    return table.id!
}

export const ensureDataStoreUptodate = async (api: Api<unknown>, projectName: string, orgs: string, nocoUrl: string): Promise<string> => {
    const projects = await api.project.list()
    if(projects.list.some((proj) => proj.title === projectName)) {
      try {
        logData(`Project ${projectName} detected, checking for a migration ...`, {})
        const result = await ensureMigrationApplied(api, projectName, orgs)
        await insertTestData()
        logData('Startup complete.', {})
        return result
      } catch(e: any) {
        logData(`Error when migrating ${projectName}.`, e)
        throw e
      }
    } else {
      try {
        await createInitial(api, projectName, nocoUrl, orgs)
        await insertTestData()
        return 'Database initialized.'
      } catch (e: any) {
        logData(`Error when creating project ${projectName}.`, e)
        throw e
      }
    }
  }