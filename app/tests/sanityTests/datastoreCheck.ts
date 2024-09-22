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
        where a.email = 'me4@me.com' and a.name = $1`, [email])

    await waitFor(() => expect(result.rowCount).toBe(1))
}