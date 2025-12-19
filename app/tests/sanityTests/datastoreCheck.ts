import { executeQuery } from './lib'

export const checkAllAccountDataCreated = async (email: string) => {
    const result = await executeQuery(`select *
        from sb.accounts a
        inner join sb.broadcast_prefs bp on bp.account_id = a.id and bp.event_type = 2
        inner join sb.notifications n on n.account_id = a.id
        where a.email = lower($1)`, [email])

    expect(result.rowCount).toBe(1)
}

export const checkAccountData = async (email: string, name: string) => {
    const result = await executeQuery(`select *
        from sb.accounts a
        where a.email = lower($1) and a.name = $2`, [email, name])
    
    expect(result.rowCount).toBe(1)
}

export const checkAccountAddress = async (address: string, latitude: number, longitude: number, accountId: number) => {
    const result = await executeQuery(`select *
        from sb.accounts a inner join sb.locations l on l.id = a.location_id
        where a.id = $1 and l.address = $2 and l.latitude = $3 and l.longitude = $4`, [accountId, address, latitude, longitude])
    
    expect(result.rowCount).toBe(1)
}

export const checkAccountLogo = async (publicId: string, accountId: number) => {
    const result = await executeQuery(`select *
        from sb.accounts a
        inner join sb.images i on a.avatar_image_id = i.id
        where a.id = $1 and i.public_id = $2`, [accountId, publicId])
    
    return result.rowCount === 1
}

export const checkLinksOnAccount = async (email: string, links: { label: string, url: string, type: number}[]) => {
    const result = await executeQuery(`select label, url, link_type_id
        from sb.accounts_links al
        inner join sb.accounts a on a.id = al.account_id
        where a.email = lower($1)`, [email])

    links.forEach(link => {
        const linkRow = result.rows.find((row: any) => row.label === link.label)
        expect(linkRow).toBeDefined()
        expect(linkRow.url).toEqual(link.url)
        expect(linkRow.link_type_id).toEqual(link.type)
    })
}

export const checkActivationEmailSent = async (email: string): Promise<string> => {
    const result = await executeQuery(`select * from sb.email_activations ea
        inner join sb.mails m on m.email = ea.email and m.text_content like '%' || ea.activation_code || '%'
        where lower(ea.email)=$1`, [email])

    expect(result.rowCount).toBe(1)

    return /"http(s?):\/\/.*activate\/([^"]*)"/.exec(result.rows[0].html_content)![2]
}

export const checkAccountActivated = async (email: string) => {
    const result = await executeQuery(`select *
        from sb.accounts
        where email = lower($1) and activated is not null`, [email])

    return result.rowCount && result.rowCount > 0
}

export const getActivationUrlFromMail = async (email: string) => {
    const result = await executeQuery(`select html_content
        from sb.mails m inner join sb.accounts a on m.email = a.email
        where a.email = lower($1)`, [email])

    expect(result.rowCount).toBe(1)
    return result.rows[0].html_content.match(/http:\/\/localhost:.*\/webapp\/v.*\/activate\/\w*/g)
}

export const checkResourcePresent = async (accountEmail: string, title: string, description: string,
    isProduct: boolean, isService: boolean, canBeDelivered: boolean, canBeTakenAway: boolean, 
    canBeExchanged: boolean, canBeGifted: boolean, expiration: Date, categoryCodes: number[]
) => {
    const result = await executeQuery(`select r.id as resource_id, * from sb.resources r
        inner join sb.accounts a on a.id = r.account_id
        where a.email = lower($1) and r.title = $2`, [accountEmail, title])
    
    expect(result.rowCount).toBe(1)

    const catsPromise = executeQuery(`select code from sb.resource_categories rc
        inner join sb.resources_resource_categories rrc on rc.code = rrc.resource_category_code and rc.locale='fr'
        where rrc.resource_id = $1`, [result.rows[0].resource_id])

    expect(result.rows[0].description).toBe(description)
    expect(result.rows[0].is_product).toBe(isProduct)
    expect(result.rows[0].is_service).toBe(isService)
    expect(result.rows[0].can_be_delivered).toBe(canBeDelivered)
    expect(result.rows[0].can_be_taken_away).toBe(canBeTakenAway)
    expect(result.rows[0].can_be_gifted).toBe(canBeGifted)
    expect(result.rows[0].can_be_exchanged).toBe(canBeExchanged)
    expect(result.rows[0].expiration).toEqual(expiration)
    const cats = await catsPromise
    expect(cats.rowCount).toBe(categoryCodes.length)
    categoryCodes.forEach(code => expect((cats.rows as any[]).some(row => row.code === code)).toBe(true))
}

export const checkHasNotifications = async (email: string, uniquePropNames: string[]): Promise<{ notifId: number, uniquePropName: string, uniquePropValue: any }[]> => {
    const notifs = await executeQuery(`select n.id, n.account_id, n.data from sb.notifications n
        inner join sb.accounts a on a.id = n.account_id
        where a.email = lower($1)`, [email])
    
    expect(notifs.rowCount).toEqual(uniquePropNames.length)

    const alreadyReturned: number[] = []
    return uniquePropNames.map(name => {
        const notif = notifs.rows.find(row => !!row.data[name] && !alreadyReturned.includes(row.id))
        if(!notif) throw new Error(`Could not find notification by data prop name '${name}' in ${notifs.rows}`)
        alreadyReturned.push(notif.id)
        return { notifId: notif.id, uniquePropName: name, uniquePropValue: notif.data[name] }
    })
}

export const checkHasNoNotification = async (email: string) => {
    const notifs = await executeQuery(`select n.id from sb.notifications n
        inner join sb.accounts a on a.id = n.account_id
        where a.email = lower($1)`, [email])
    
    expect(notifs.rowCount).toEqual(0)
}

export const checkLastNotificationExists = async (email: string): Promise<any> => {
    const notif = await executeQuery(`select n.id, n.account_id from sb.notifications n
        inner join sb.accounts a on a.id = n.account_id
        where a.email = lower($1)
        limit 1`, [email])

    expect(notif.rowCount).toBeGreaterThan(0)

    return notif.rows[0]
}

export const checkANotificationExists = async (email: string, validateData: (data: any) => boolean) => {
    let retValue: boolean = false
    const result = await executeQuery(`select n.data from sb.notifications n
            inner join sb.accounts a on a.id = n.account_id
            where a.email = lower($1)
            order by n.created desc
            limit 1`, [email])

    if(result.rowCount === 0) {
        retValue = false
    } else {
        retValue = result.rows.some(row => validateData(row.data))
    }

    //console.log('retValue', retValue)
    return retValue
}

export const checkAccountTokens = async (email: string, expectedAmountOfTokens: number) => {
    const result = await executeQuery(`select amount_of_tokens from sb.accounts
        where email = lower($1)`, [email])
    
    expect(result.rows[0].amount_of_tokens).toBe(expectedAmountOfTokens)
}

export const getTokenAmounts = async (accountIds: number[]): Promise<{[accountId: number]: number}> => {
    const result = await executeQuery(`select id, amount_of_tokens from sb.accounts where id in (${accountIds.join(',')})`)

    const returnValue: {[accountId: number]: number} = {}

    result.rows.forEach(row => { returnValue[row.id] = row.amount_of_tokens })

    return returnValue
}

export const checkTokenTransactionExists = async (accountId: number, transactionType: number, movement: number, targetAccountId: number) => {
    const result = await executeQuery(`select * from sb.accounts_token_transactions 
        where account_id = $1 AND token_transaction_type_id = $2 AND movement = $3 AND target_account_id = $4`,
        [accountId, transactionType, movement, targetAccountId]
    )

    return result.rowCount && result.rowCount > 0
}