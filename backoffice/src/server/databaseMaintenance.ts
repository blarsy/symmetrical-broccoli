import { NormalColumnRequestType, Api, LinkToAnotherColumnReqType } from "nocodb-sdk"
import { logData } from "./logger"
import { answerInvite, create, invite } from "./dal/user"
import { create as createResource} from './dal/resource'
import { getOne, list, update } from "./noco"

const systemTableName = 'systeme'
const accountsTableName = 'comptes'
const resourceCategoriesTableName = 'categories'
const resourceTableName = 'ressources'

const testPwd1 = process.env.TEST_PWD_1 as string
const testPwd2 = process.env.TEST_PWD_2 as string
const testPwd3 = process.env.TEST_PWD_3 as string
const testPwd4 = process.env.TEST_PWD_4 as string

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
    const resourcesTable = await apiInNewProject.dbTable.create(projectId, { table_name: resourceTableName, title: resourceTableName, columns: [
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
        childId: resourcesTable.id!, parentId: accountsTable.id!, title: resourceTableName,
        type: 'hm', uidt: 'LinkToAnotherRecord', virtual: false
    } as LinkToAnotherColumnReqType)
    await apiInNewProject.dbTableColumn.create(accountsTable.id!, {
        childId: accountsTable.id!, parentId: accountsTable.id!, title: 'comptes_liés',
        type: 'mm', uidt: 'LinkToAnotherRecord', virtual: false
    } as LinkToAnotherColumnReqType)
    await migrateToV1_0_0(apiInNewProject, projectId, orgs, projectName)
    await migrateToV1_0_1(apiInNewProject, projectId)
    await migrateToV1_0_2(apiInNewProject, projectId, orgs, projectName)
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

const migrateToV1_0_1 = async (api: Api<unknown>, projectId: string) => {
    const accountsTableId = await getTableId(api, projectId, accountsTableName)

    await api.dbTableColumn.create(accountsTableId, { column_name: 'code_restauration', title: 'code_restauration', uidt: 'SingleLineText' })
    await api.dbTableColumn.create(accountsTableId, { column_name: 'expiration_code_restauration', title: 'expiration_code_restauration', uidt: 'DateTime' })

    await update(systemTableName, 1, { version: '1.0.1' })
}

const migrateToV1_0_2 = async (api: Api<unknown>, projectId: string, orgs: string, projectName: string) => {
    const categoriesTbl = await api.dbTable.create(projectId, { table_name: resourceCategoriesTableName, title: resourceCategoriesTableName, columns: [
        ...systemCols,
        { column_name: 'nom', title: 'nom', uidt: 'SingleLineText', pv: true }
    ] })
    await api.dbTableRow.create(orgs, projectName, resourceCategoriesTableName, { nom: 'Meubles' })
    await api.dbTableRow.create(orgs, projectName, resourceCategoriesTableName, { nom: 'Vaisselle & ustensiles de cuisine' })
    await api.dbTableRow.create(orgs, projectName, resourceCategoriesTableName, { nom: 'Décoration de la maison' })
    await api.dbTableRow.create(orgs, projectName, resourceCategoriesTableName, { nom: 'Entretien de la maison' })
    await api.dbTableRow.create(orgs, projectName, resourceCategoriesTableName, { nom: 'Petit électroménager' })
    await api.dbTableRow.create(orgs, projectName, resourceCategoriesTableName, { nom: 'Gros électroménager' })
    await api.dbTableRow.create(orgs, projectName, resourceCategoriesTableName, { nom: 'Machines & équipements' })
    await api.dbTableRow.create(orgs, projectName, resourceCategoriesTableName, { nom: 'Mobilier de jardin' })
    await api.dbTableRow.create(orgs, projectName, resourceCategoriesTableName, { nom: 'Petit outillage & accessoires' })
    await api.dbTableRow.create(orgs, projectName, resourceCategoriesTableName, { nom: 'Plantes & jardin' })
    await api.dbTableRow.create(orgs, projectName, resourceCategoriesTableName, { nom: 'Vêtements' })
    await api.dbTableRow.create(orgs, projectName, resourceCategoriesTableName, { nom: 'Accessoires de mode' })
    await api.dbTableRow.create(orgs, projectName, resourceCategoriesTableName, { nom: 'Chaussures' })
    await api.dbTableRow.create(orgs, projectName, resourceCategoriesTableName, { nom: 'Produits & accessoires d\'hygiène' })
    await api.dbTableRow.create(orgs, projectName, resourceCategoriesTableName, { nom: 'Maquillage' })
    await api.dbTableRow.create(orgs, projectName, resourceCategoriesTableName, { nom: 'Informatique' })
    await api.dbTableRow.create(orgs, projectName, resourceCategoriesTableName, { nom: 'TV, Hi-Fi, téléphonie' })
    await api.dbTableRow.create(orgs, projectName, resourceCategoriesTableName, { nom: 'Câbles, coques & accessoires' })
    await api.dbTableRow.create(orgs, projectName, resourceCategoriesTableName, { nom: 'Livres, films & musique' })
    await api.dbTableRow.create(orgs, projectName, resourceCategoriesTableName, { nom: 'Jeux & jouets' })
    await api.dbTableRow.create(orgs, projectName, resourceCategoriesTableName, { nom: 'Jeux vidéo' })
    await api.dbTableRow.create(orgs, projectName, resourceCategoriesTableName, { nom: 'Matériels & équipements sportifs' })
    await api.dbTableRow.create(orgs, projectName, resourceCategoriesTableName, { nom: 'Autres accessoires de sport' })
    await api.dbTableRow.create(orgs, projectName, resourceCategoriesTableName, { nom: 'Papeterie & fourniture de bureau' })
    await api.dbTableRow.create(orgs, projectName, resourceCategoriesTableName, { nom: 'Loisirs créatifs' })
    await api.dbTableRow.create(orgs, projectName, resourceCategoriesTableName, { nom: 'Vêtements bébé' })
    await api.dbTableRow.create(orgs, projectName, resourceCategoriesTableName, { nom: 'Jouets pour bébé' })
    await api.dbTableRow.create(orgs, projectName, resourceCategoriesTableName, { nom: 'Équipement de puériculture' })
    await api.dbTableRow.create(orgs, projectName, resourceCategoriesTableName, { nom: 'Petits accessoires & consommables' })
    await api.dbTableRow.create(orgs, projectName, resourceCategoriesTableName, { nom: 'Nourriture pour animaux' })
    await api.dbTableRow.create(orgs, projectName, resourceCategoriesTableName, { nom: 'Accessoires pour animaux' })
    await api.dbTableRow.create(orgs, projectName, resourceCategoriesTableName, { nom: 'Objets' })
    await api.dbTableRow.create(orgs, projectName, resourceCategoriesTableName, { nom: 'Nourriture' })
    await api.dbTableRow.create(orgs, projectName, resourceCategoriesTableName, { nom: 'Autre' })

    const tables = await api.dbTable.list(projectId)

    const ressourcesTblId = tables.list.find(table => table.title === resourceTableName)!.id!
    await api.dbTableColumn.create(ressourcesTblId, {
        childId: categoriesTbl.id!, parentId: ressourcesTblId, title: resourceCategoriesTableName,
        type: 'hm', uidt: 'LinkToAnotherRecord', virtual: false
    } as LinkToAnotherColumnReqType)

    await update(systemTableName, 1, { version: '1.0.2' })
}

const migrateToV1_0_3 = async () => {
    const testAccounts = await list('comptes', `(email,eq,tester@apple.com)`, ['Id'])
    if(testAccounts.length === 0) {
        await create('Apple tester', 'tester@apple.com', testPwd4)
    }

    await update(systemTableName, 1, { version: '1.0.3' })
}

const migrateToV1_0_4 = async (api: Api<unknown>, projectId: string) => {
    const tables = await api.dbTable.list(projectId)
    const categoriesTblId = tables.list.find(table => table.title === resourceCategoriesTableName)!.id!
    const resourceTbl = tables.list.find(table => table.title === resourceTableName)!
    const ressourcesTblId = resourceTbl.id!
    const resourceTblFull = await api.dbTable.read(ressourcesTblId)
    
    const categoryResourceColId = resourceTblFull.columns!.find(col => col.title === resourceCategoriesTableName )!.id!
    await api.dbTableColumn.delete(categoryResourceColId)
    await api.dbTableColumn.create(ressourcesTblId, {
        childId: categoriesTblId, parentId: ressourcesTblId, title: resourceCategoriesTableName,
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
            createResource(accounts[0].id, 'Matelas 2 personnes', 'Double emploi', new Date(new Date().valueOf() + (10 * 24 * 60 * 60 * 1000)), [], []),
            createResource(accounts[0].id, 'Pigments peinture argile', 'Restes de mes travaux. Jaune, bleu, vert.', new Date(new Date().valueOf() + (8 * 24 * 60 * 60 * 1000)), [
                { title: 'Retrait sur place', description: 'Pas de livraison' },
                { title: 'Prix fixe', description: 'Pas de négociations, on ne répondra pas aux offres plus basses que le prix demandé.'}
            ], []),
            createResource(accounts[1].id, 'Bois de chauffe', 'Une stère de bois mélangé bouleau, peuplier et érable.', new Date(new Date().valueOf() + (5 * 24 * 60 * 60 * 1000)), [], []),
            invite(accounts[0].email, accounts[1].id.toString())
        ])
        return Promise.all([
            answerInvite(accounts[1].email, accounts[0].id.toString(), true)
        ])
    } else {
        const testAccounts = await list('comptes', `(email,eq,test1@gmail.com)`, ['Id'])
        if(testAccounts.length === 0) {
            await Promise.all([
                create('Google test1', 'test1@gmail.com', testPwd1),
                create('Google test2', 'test2@gmail.com', testPwd2),
                create('Google test3', 'test3@gmail.com', testPwd3)
            ])
        }
    }
}

const ensureMigrationApplied = async (api: Api<unknown>, projectName: string, orgs: string): Promise<string> => {
    const projectId = await getProjectId(api, projectName)
    const tables = await api.dbTable.list(projectId)
    if(!tables.list.some((table) => table.title === systemTableName)) {
        await migrateToV1_0_0(api, projectId, orgs, projectName)
        await migrateToV1_0_1(api, projectId)
        await migrateToV1_0_2(api, projectId, orgs, projectName)
        await migrateToV1_0_3()
        await migrateToV1_0_4(api, projectId)
        return 'Migrated to 1.0.3'
    } else {
        const systemRow = await getOne('systeme', `{1,eq,1}`, ['version'])
        if(systemRow.version === '1.0.0') {
            await migrateToV1_0_1(api, projectId)
            return 'Migrated to 1.0.1'
        } else if(systemRow.version === '1.0.1') {
            await migrateToV1_0_2(api, projectId, orgs, projectName)
            return 'Migrated to 1.0.2'
        } else if(systemRow.version === '1.0.2') {
            await migrateToV1_0_3()
            return 'Migrated to 1.0.3'
        } else if(systemRow.version === '1.0.3') {
            await migrateToV1_0_4(api, projectId)
            return 'Migrated to 1.0.4'
        } else {
            return 'Db already up to date'
        }
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