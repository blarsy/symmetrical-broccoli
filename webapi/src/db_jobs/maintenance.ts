import { Client } from "pg"
import logger from "../logger"

export const cleanOldClientLogsJob =  async (payload: { daysOfLogToKeep: number, connectionString: string }) => {
    const pgClient = new Client(payload.connectionString)
    try {
        await pgClient.connect()
        const cleanupStatement = `DELETE FROM sb.client_logs
            WHERE created < to_timestamp(extract(epoch from now() - interval '${payload.daysOfLogToKeep} day'));`
        logger.info(`Running client logs cleanup: ${cleanupStatement}`)
        await pgClient.query(cleanupStatement)
    }
    finally {
        await pgClient.end()
    }
}