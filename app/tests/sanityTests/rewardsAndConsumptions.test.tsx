import { applyResourceRewards, cleanupTestAccounts, createResourceLowLevel, createResourceLowLevelWithAnImage, makeTestAccounts, TestAccount } from "./datastoreSetupLib"
import '@testing-library/react-native/extend-expect'
import dayjs from "dayjs"
import { checkAccountTokens } from "./datastoreCheck"

let testAccounts: TestAccount[]

beforeEach(async () => {
    testAccounts = await makeTestAccounts([{ confirm: true, contributor: true },{ confirm: true, contributor: true }])
})

afterEach(async () => {
    await cleanupTestAccounts(testAccounts)
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
         })
    ])
    
   await applyResourceRewards(testAccounts[0].data.token, testAccounts[0].data.id)

   // should have 30 (account creation reward) + 20 (1 resourcese created for 24 hours)
   await checkAccountTokens(testAccounts[0].info.email, 50)
   // should have only 30 (account creation reward)
   await checkAccountTokens(testAccounts[1].info.email, 30)

   await applyResourceRewards(testAccounts[1].data.token, testAccounts[1].data.id)

   // should have 30 (account creation reward) + 20 (1 resourcese created for 24 hours)
   await checkAccountTokens(testAccounts[0].info.email, 50)
   // should have 75 (account creation reward)+ 2 resources, 1 with image)
   await checkAccountTokens(testAccounts[1].info.email, 75)
})