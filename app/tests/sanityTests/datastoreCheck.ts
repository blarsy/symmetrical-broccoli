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

export const checkLinksOnAccount = async (email: string, links: { label: string, url: string, type: number}[]) => {
    const result = await executeQuery(`select label, url, link_type_id
        from sb.accounts_links al
        inner join sb.accounts a on a.id = al.account_id
        where a.email = lower($1)`, [email])

    expect(result.rowCount).toBe(links.length)
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
    
    console.log('notifs.rowCount uniquePropNames.length', notifs.rowCount, uniquePropNames, uniquePropNames.length)
    expect(notifs.rowCount).toEqual(uniquePropNames.length)

    return uniquePropNames.map(name => {
        const notif = notifs.rows.find(row => !!row.data[name])
        if(!notif) throw new Error(`Could not find notification by data prop name '${name}' in ${notifs.rows}`)
        return { notifId: notif.id, uniquePropName: name, uniquePropValue: notif.data[name] }
    })
}

export const checkLastNotificationExists = async (email: string): Promise<any> => {
    const notif = await executeQuery(`select n.id, n.account_id from sb.notifications n
        inner join sb.accounts a on a.id = n.account_id
        where a.email = lower($1)
        limit 1`, [email])

    expect(notif.rowCount).toBeGreaterThan(0)

    return notif.rows[0]
}