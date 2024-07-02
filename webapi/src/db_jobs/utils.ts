import { Client } from "pg"
import logger from "../logger"

export const runAndLog  = async (statement: string, connectionString: string, description: string) => {
    const pgClient = new Client({ connectionString })
    try {
        await pgClient.connect()
        logger.info(`${description}: ${statement}`)
        return await pgClient.query(statement)
    }
    finally {
        await pgClient.end()
    }
}