import { Pool } from "pg"
import logger from "../logger"

export const runAndLog  = async (statement: string, pool: Pool, description: string, paramValues: any[] = []) => {
    const client = await pool.connect()
    logger.info(`${description}: ${statement}`)
    try {
        return await client.query(statement, paramValues)
    } finally {
        client.release()
    }
}