import { waitFor } from "@testing-library/react-native"
import { checkANotificationExists } from "./datastoreCheck"
import { createAndLogIn, createCampaign, createResource, deleteAccount, fromToday, getTestNum, removeActiveCampaign, searchResourcesOnTerm, setAccountAddress } from "./datastoreSetupLib"

const password = 'Password1!'
const testNum = getTestNum()

test('Notifications created on right accounts when new resource created', async () => {
    // create a bunch of resources on their own account

    const campaignId = await createCampaign(`campaign${testNum}`, 'desc', fromToday(10), 4000, 5, fromToday(-1), fromToday(20))

    const [accountWithLocation, accountInCampaign, accountWithSearchTerm, creatorAccount] = await Promise.all([
        createAndLogIn(`a1-${testNum}@test.com`, `a1${testNum}`, password, true),
        createAndLogIn(`a2-${testNum}@test.com`, `a2${testNum}`, password, true),
        createAndLogIn(`a3-${testNum}@test.com`, `a3${testNum}`, password, true),
        createAndLogIn(`a4-${testNum}@test.com`, `a4${testNum}`, password, true),
    ])

    await Promise.all([
        // setup the account that should get a search term related to the new resource
        searchResourcesOnTerm(accountWithSearchTerm.token, 'Pots'),
        // setup the account that should be located close to the new resource
        setAccountAddress(accountWithLocation.token, { address: 'maison', latitude: 50.5838438, longitude: 3.5786905 }),
        // setup the account that should participate in the smae campaign as the new resource
        createResource(accountInCampaign.token, 'dummy title', 'desc', false, false, false, false, false, false, null, [1],null, campaignId)
    ])

    //create resources with such data that they should create some notification on the above created accounts
    const closeResourceId = await createResource(creatorAccount.token, 'resource located closely', 'desc', false, false, false, false, false, false, null, [1], { address: 'pas loin maison', latitude: 50.602587, longitude: 3.5717666 })

    // at this point, none of the resource should trigger a notification
    await waitFor(async() => expect(await checkANotificationExists(`a1-${testNum}@test.com`, data => data.resource_id && data.resource_id === closeResourceId)).toBeFalsy())
    await waitFor(async() => expect(await checkANotificationExists(`a2-${testNum}@test.com`, data => data.resource_id && data.resource_id === closeResourceId)).toBeFalsy())
    await waitFor(async() => expect(await checkANotificationExists(`a3-${testNum}@test.com`, data => data.resource_id && data.resource_id === closeResourceId)).toBeFalsy())
    await waitFor(async() => expect(await checkANotificationExists(`a4-${testNum}@test.com`, data => data.resource_id && data.resource_id === closeResourceId)).toBeFalsy())

    // Ensure accountWithLocation is now also part of the campaign
    await createResource(accountWithLocation.token, 'other resource in campaign', 'desc', false, false, false, false, false, false, null, [1], null, campaignId)
    const closeAndInCampaignResId = await createResource(creatorAccount.token, 'resource located closely', 'desc', false, false, false, false, false, false, null, [1], { address: 'pas loin maison', latitude: 50.602587, longitude: 3.5717666 }, campaignId)
    
    await waitFor(async() => expect(await checkANotificationExists(`a1-${testNum}@test.com`, data => data.resource_id && data.resource_id === closeAndInCampaignResId)).toBeTruthy())
    await waitFor(async() => expect(await checkANotificationExists(`a2-${testNum}@test.com`, data => data.resource_id && data.resource_id === closeAndInCampaignResId)).toBeFalsy())
    await waitFor(async() => expect(await checkANotificationExists(`a3-${testNum}@test.com`, data => data.resource_id && data.resource_id === closeAndInCampaignResId)).toBeFalsy())
    await waitFor(async() => expect(await checkANotificationExists(`a4-${testNum}@test.com`, data => data.resource_id && data.resource_id === closeAndInCampaignResId)).toBeFalsy())

    // Ensure accountInCampaign has a search term related to the resource we are ab out to create
    await searchResourcesOnTerm(accountInCampaign.token, 'Baskets')
    const inCampaignAndRelatedResId = await createResource(creatorAccount.token, 'Baskets Asics', 'desc', false, false, false, false, false, false, null, [1], null, campaignId)
    
    await waitFor(async() => expect(await checkANotificationExists(`a2-${testNum}@test.com`, data => data.resource_id && data.resource_id === inCampaignAndRelatedResId)).toBeTruthy())
    await waitFor(async() => expect(await checkANotificationExists(`a1-${testNum}@test.com`, data => data.resource_id && data.resource_id === inCampaignAndRelatedResId)).toBeFalsy())
    await waitFor(async() => expect(await checkANotificationExists(`a3-${testNum}@test.com`, data => data.resource_id && data.resource_id === inCampaignAndRelatedResId)).toBeFalsy())
    await waitFor(async() => expect(await checkANotificationExists(`a4-${testNum}@test.com`, data => data.resource_id && data.resource_id === inCampaignAndRelatedResId)).toBeFalsy())

    // Ensure accountWithSearchTerm is also close to the resource we're about to create
    setAccountAddress(accountWithSearchTerm.token, { address: 'maison', latitude: 50.5838438, longitude: 3.5786905 })
    const relatedAndCloseResId = await createResource(creatorAccount.token, 'Pots Weck', 'desc', false, false, false, false, false, false, null, [1], { address: 'pas loin maison', latitude: 50.602587, longitude: 3.5717666 })

    await waitFor(async() => expect(await checkANotificationExists(`a3-${testNum}@test.com`, data => data.resource_id && data.resource_id === relatedAndCloseResId)).toBeTruthy())
    await waitFor(async() => expect(await checkANotificationExists(`a2-${testNum}@test.com`, data => data.resource_id && data.resource_id === relatedAndCloseResId)).toBeFalsy())
    await waitFor(async() => expect(await checkANotificationExists(`a1-${testNum}@test.com`, data => data.resource_id && data.resource_id === relatedAndCloseResId)).toBeFalsy())
    await waitFor(async() => expect(await checkANotificationExists(`a4-${testNum}@test.com`, data => data.resource_id && data.resource_id === relatedAndCloseResId)).toBeFalsy())
})

afterAll(async () => {
    await removeActiveCampaign()
    return Promise.all([
        deleteAccount(`a1-${testNum}@test.com`, password),
        deleteAccount(`a2-${testNum}@test.com`, password),
        deleteAccount(`a3-${testNum}@test.com`, password),
        deleteAccount(`a4-${testNum}@test.com`, password)
    ]) 
})