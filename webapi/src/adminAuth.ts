import { json } from "express"
import {Express} from "express-serve-static-core"
import { runAndLog } from "./db_jobs/utils"
import { Pool } from "pg"
import { CorsRequest } from "cors"
import { randomUUID } from 'node:crypto'
import { verifyMessage } from "ethers"
import { loggers } from "./logger"

export default (app: Express, pool: Pool, corsMiddleware: (req: CorsRequest, res: {
    statusCode?: number | undefined;
    setHeader(key: string, value: string): any;
    end(): any;
}, next: (err?: any) => any) => void, version: string) => {
    const logger = loggers[version]
    app.use(json())
    
    app.post(`/adminchallenge`, corsMiddleware, async (req, res) => {
        if(req.body.publickey) {
            try {
                const challenge = `${randomUUID()}`
                await runAndLog(`UPDATE sb.admins_public_keys SET last_challenge_expires = NOW() + 10 * interval '1 second', last_challenge = (($1)) WHERE public_key=($2)`, pool, 'Creating challenge admin token', version, [challenge, req.body.publickey])

                res.send({ challenge })
            } catch (e) {
                logger.error('Error creating admin token challenge', e)
                res.status(500).send({ error: 'Challenge creation failed' })
            }
        } else {
            res.status(422).send({ error: 'Missing parameter' })
        }
    })
    app.post(`/adminauth`, corsMiddleware, async (req, res) => {
        if(req.body.signature && req.body.publickey) {
            try {
                const qryRes = await runAndLog(`SELECT last_challenge FROM sb.admins_public_keys WHERE public_key=($1) AND last_challenge_expires > NOW()`,
                    pool, 'Getting challenge to be compared', version, [req.body.publickey])
                
                if(qryRes.rowCount != 1) {
                    // fail silently
                    res.send({token: ''})
                    return
                }
                const adminPubKey = verifyMessage(qryRes.rows[0].last_challenge, req.body.signature)

                if(adminPubKey != req.body.publickey) {
                    // fail silently
                    res.send({token: ''})
                    return
                }

                const exchangeToken = randomUUID()

                await runAndLog(`UPDATE sb.admins_public_keys SET last_challenge_expires=NULL, last_challenge=NULL, exchange_token=($1), exchange_token_expires= NOW() + 10 * interval '1 second' WHERE public_key=($2)`,
                    pool, 'Creating admin exchange token', version, [exchangeToken, req.body.publickey]
                )

                res.send({ token: exchangeToken })
            } catch (e) {
                logger.error('Error creating token from signature', e)
                res.status(500).send({ error: 'Verification failed' })
            }
        } else {
            res.status(422).send({ error: 'Missing parameter' })
        }
    })
}