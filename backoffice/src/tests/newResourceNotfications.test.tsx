import dayjs from "dayjs"
import { checkLastNotificationOnAccount, cleanupTestAccounts, createCampaign, createResource, fromToday, makeSearch, makeTestAccounts, removeActiveCampaign, setAccountLocation, TestAccount } from "./datastoreSetupLib"
import { waitFor } from "@testing-library/dom"

let accounts: TestAccount[]

test('New resource gets notified to accounts geographically close and who searched on the resource title', async () => {
    accounts = await makeTestAccounts([ { confirm: true, contributor: true }, { confirm: true, contributor: true }, { confirm: true, contributor: true }, { confirm: true, contributor: true } ])
    const [creator, close1, close2, far] = accounts

    await Promise.all([
        setAccountLocation(creator, { address: 'Place de Pipaix, 16', latitude: 50.5838438, longitude: 3.5786905 }),
        setAccountLocation(close1, { address: 'Rue Albert Allard 4, Tournai, Belgique', latitude: 50.6077539, longitude: 3.377991 }),
        setAccountLocation(close2, { address: 'Rue Albert Allard 5, Tournai, Belgique', latitude: 50.6077538, longitude: 3.377991 }),
        setAccountLocation(far, { address: 'Rongy Park, Moondarra Street, Pimpama Queensland, Australie', latitude: -27.8186319, longitude: 153.3043163 })
    ])

    // make on of the close account make a relevant search for our new resource
    await makeSearch(close1, creator.info.name)

    const resId = await createResource(creator.data.token, `new resource${creator.info.name}`, 'desc', true, true, true, false, 
        true, false, dayjs().add(10, "days").toDate(), [1], undefined, 
        { address: '"Rue Saint-Jacques 11, Tournai, Belgique"', latitude: 50.6094964, longitude: 3.3851995 })

    await waitFor(() => checkLastNotificationOnAccount(close1.data.id, parsed => parsed.resource_id && parsed.resource_id === resId))
    await checkLastNotificationOnAccount(close2.data.id, parsed => !parsed.resource_id || parsed.resource_id != resId)
    await checkLastNotificationOnAccount(far.data.id, parsed => !parsed.resource_id || parsed.resource_id != resId)
})

test('New resource gets notified to accounts geographically close and who searched on the resource description', async () => {
    accounts = await makeTestAccounts([ { confirm: true, contributor: true }, { confirm: true, contributor: true }, { confirm: true, contributor: true }, { confirm: true, contributor: true } ])
    const [creator, close1, close2, far] = accounts

    await Promise.all([
        setAccountLocation(creator, { address: 'Place de Pipaix, 16', latitude: 50.5838438, longitude: 3.5786905 }),
        setAccountLocation(close1, { address: 'Rue Albert Allard 4, Tournai, Belgique', latitude: 50.6077539, longitude: 3.377991 }),
        setAccountLocation(close2, { address: 'Rue Albert Allard 5, Tournai, Belgique', latitude: 50.6077538, longitude: 3.377991 }),
        setAccountLocation(far, { address: 'Rongy Park, Moondarra Street, Pimpama Queensland, Australie', latitude: -27.8186319, longitude: 153.3043163 })
    ])

    // make on of the close account make a relevant search for our new resource
    await makeSearch(close1, `new resource${creator.info.name}description`)

    const resId = await createResource(creator.data.token, `Useless name`, `new resource${creator.info.name}description`, true, true, true, false, 
        true, false, dayjs().add(10, "days").toDate(), [1], undefined, 
        { address: '"Rue Saint-Jacques 11, Tournai, Belgique"', latitude: 50.6094964, longitude: 3.3851995 })

    await waitFor(() => checkLastNotificationOnAccount(close1.data.id, parsed => parsed.resource_id && parsed.resource_id === resId))
    await checkLastNotificationOnAccount(close2.data.id, parsed => !parsed.resource_id || parsed.resource_id != resId)
    await checkLastNotificationOnAccount(far.data.id, parsed => !parsed.resource_id || parsed.resource_id != resId)
})

test('New resource gets notified to accounts having searched on the ne resource title and part of the same campaign', async () => {
    accounts = await makeTestAccounts([ { confirm: true, contributor: true }, 
        { confirm: true, contributor: true }, { confirm: true, contributor: true } ])
    const [creator, target, unrelated] = accounts

    try {
        const campaignId = await createCampaign('test campaign', 'description for test campaign', 
            new Date(new Date().valueOf() - 100), 5000, 6, fromToday(-2),  fromToday(4))

        // make a relevant search on of the target account
        await makeSearch(target, `new resource${creator.info.name}`)
    
        // create a resource belonging to the campaign on the target account
        await createResource(target.data.token, `resource-in-campaign${target.info.name}`, `description`, 
            true, true, true, false, true, false, dayjs().add(10, "days").toDate(), [1], campaignId)

        const resId = await createResource(creator.data.token, `new resource${creator.info.name}`, 
            `new resource${creator.info.name}description`, true, true, true, false, 
            true, false, dayjs().add(10, "days").toDate(), [1], campaignId)

        await waitFor(() => checkLastNotificationOnAccount(target.data.id, parsed => parsed.resource_id && parsed.resource_id === resId))
        await checkLastNotificationOnAccount(unrelated.data.id, parsed => !parsed.resource_id || parsed.resource_id != resId)
    }
    finally {
        await removeActiveCampaign()
    }
})

afterEach(async () => {
    return cleanupTestAccounts(accounts)
})