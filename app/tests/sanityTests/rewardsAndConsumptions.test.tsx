import { applyResourceRewards, cleanupTestAccounts, createCampaign, createResourceLowLevel, 
   createResourceLowLevelWithAnImage, fromToday, makeTestAccounts, removeActiveCampaign, TestAccount } from "./datastoreSetupLib"
import dayjs from "dayjs"
import { checkAccountTokens } from "./datastoreCheck"

let testAccounts: TestAccount[]
let campaignId: string

beforeEach(async () => {
   testAccounts = await makeTestAccounts([{ confirm: true, contributor: true },{ confirm: true, contributor: true }, {confirm: true, contributor: true}])
   campaignId = await createCampaign('Test campaign', 'description of test campaign', fromToday(10), 3000, 5, fromToday(-1), fromToday(15))
})

afterEach(async () => {
    await cleanupTestAccounts(testAccounts)
    await removeActiveCampaign()
})

test('Apply rewards', async () => {

   await Promise.all([
        createResourceLowLevel({ 
            accountId: testAccounts[1].data.id,  expiration: dayjs(new Date()).add(1, "days").toDate(), 
            created: dayjs(new Date()).add(-1, "days").toDate(), title: `res${testAccounts[1].info.name}`
         }),
         createResourceLowLevel({ 
            accountId: testAccounts[0].data.id,  expiration: dayjs(new Date()).add(1, "days").toDate(), 
            title: `res${testAccounts[0].info.name}`
         }),
         createResourceLowLevelWithAnImage({ 
            accountId: testAccounts[1].data.id,  expiration: dayjs(new Date()).add(1, "days").toDate(), 
            created: dayjs(new Date()).add(-1, "days").toDate(), title: `res${testAccounts[1].info.name}`
         }, 'd96ifkunm53v7biuocaj'),
         createResourceLowLevel({
            accountId: testAccounts[0].data.id,  expiration: dayjs(new Date()).add(1, "days").toDate(), 
            created: dayjs(new Date()).add(-1, "days").toDate(), title: `res${testAccounts[0].info.name}-1DayOld`
         }),
         createResourceLowLevel({ 
            accountId: testAccounts[0].data.id,  expiration: dayjs(new Date()).add(-1, "days").toDate(), 
            title: `res${testAccounts[0].info.name}-expired`
         }),
         createResourceLowLevel({ 
            accountId: testAccounts[0].data.id,  expiration: dayjs(new Date()).add(1, "days").toDate(), 
            created: dayjs(new Date()).add(-2, "days").toDate(), title: `res${testAccounts[0].info.name}-deleted`,
            deleted: dayjs(new Date()).add(-1, "days").toDate()
         }),
         createResourceLowLevel({ 
            accountId: testAccounts[2].data.id,  expiration: dayjs(new Date()).add(1, "days").toDate(), 
            created: dayjs(new Date()).add(-2, "days").toDate(), title: `res${testAccounts[2].info.name}`,
            campaignIdToJoin: campaignId
         })
    ])
    
   await applyResourceRewards(testAccounts[0].data.token, testAccounts[0].data.id)

   // should have 20 (1 resourcese created for 24 hours)
   await checkAccountTokens(testAccounts[0].info.email, 20)
   // should have only 0 (account just created)
   await checkAccountTokens(testAccounts[1].info.email, 0)

   await applyResourceRewards(testAccounts[1].data.token, testAccounts[1].data.id)

   // should have 20 (1 resourcese created for 24 hours)
   await checkAccountTokens(testAccounts[0].info.email, 20)
   // should have 45 (2 resources, 1 with image)
   await checkAccountTokens(testAccounts[1].info.email, 45)

   await applyResourceRewards(testAccounts[2].data.token, testAccounts[2].data.id)
   //should have (20 (1 resource for 24h) * 5 (active campaign resource multiplier))
   await checkAccountTokens(testAccounts[2].info.email, 100)
})