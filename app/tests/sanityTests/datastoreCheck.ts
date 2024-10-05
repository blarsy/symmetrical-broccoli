import { Client } from 'pg'
import config from './config'
import { waitFor } from '@testing-library/react-native'

const getOpenConnection = async () => {
    const pgClient = new Client({
        user: config.user,
        host: config.host,
        database: config.database,
        password: config.password,
        port: config.port
    })

    await pgClient.connect()

    return pgClient
}

export const checkAllAccountDataCreated = async (email: string) => {
    const client = await getOpenConnection()
    
    const result = await client.query(`select *
        from sb.accounts a
        inner join sb.broadcast_prefs bp on bp.account_id = a.id and bp.event_type = 2
        inner join sb.notifications n on n.account_id = a.id
        where a.email = lower($1)`, [email])

    expect(result.rowCount).toBe(1)
}

export const checkNameOnAccount = async (email: string, name: string) => {
    const client = await getOpenConnection()

    await waitFor(async () => {
        const result = await client.query(`select *
            from sb.accounts a
            where a.email = lower($1) and a.name = $2`, [email, name])

        expect(result.rowCount).toBe(1)
    })
}

export const checkActivationEmailSent = async (email: string): Promise<string> => {
    const client = await getOpenConnection()

    const result = await client.query(`select * from sb.email_activations ea
        inner join sb.mails m on m.email = ea.email and m.text_content like '%' || ea.activation_code || '%'
        where lower(ea.email)=$1`, [email])

    expect(result.rowCount).toBe(1)

    return /"http(s?):\/\/.*activate\/([^"]*)"/.exec(result.rows[0].html_content)![2]
}

export const checkAccountActivated = async (email: string) => {
    const client = await getOpenConnection()
    
    const result = await client.query(`select *
        from sb.accounts
        where email = lower($1) and activated is not null`, [email])

    return result.rowCount && result.rowCount > 0
}

export const getActivationUrlFromMail = async (email: string) => {
    const client = await getOpenConnection()
    
    const result = await client.query(`select html_content
        from sb.mails m inner join sb.accounts a on m.email = a.email
        where a.email = lower($1)`, [email])

    expect(result.rowCount).toBe(1)
    return result.rows[0].html_content.match(/http:\/\/localhost:.*\/webapp\/v.*\/activate\/\w*/g)
}