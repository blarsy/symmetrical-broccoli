import { Pool } from "pg"
import { loggers } from "../logger"

export const runAndLog  = async (statement: string, pool: Pool, description: string, version: string, paramValues: any[] = []) => {
    const client = await pool.connect()
    loggers[version].info(`${description}: ${statement}`)
    try {
        return await client.query(statement, paramValues)
    } finally {
        client.release()
    }
}