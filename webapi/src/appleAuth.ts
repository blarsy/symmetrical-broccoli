import { json } from "express"
import {Express} from "express-serve-static-core"
import appleSigninAuth from 'apple-signin-auth'
import { runAndLog } from "./db_jobs/utils"
import { Pool } from "pg"
import { CorsRequest } from "cors"
import { createHash } from 'node:crypto'
import { loggers } from "./logger"

export default (app: Express, pool: Pool, corsMiddleware: (req: CorsRequest, res: {
    statusCode?: number | undefined;
    setHeader(key: string, value: string): any;
    end(): any;
}, next: (err?: any) => any) => void, version: string) => {
    app.use(json())
    
    app.post(`/appleauth`, corsMiddleware, async (req, res) => {
        if(req.body.id_token && (req.body.nonce || req.body.full_nonce)) {
            try {

                const nonce = req.body.nonce ? createHash('sha256').update(req.body.nonce).digest('hex') : req.body.full_nonce
                const appleIdTokenClaims = await appleSigninAuth.verifyIdToken(req.body.id_token, {
                    /** sha256 hex hash of raw nonce */
                    nonce
                })

                const qryRes = await runAndLog(`SELECT sb.update_external_auth_status ($1, $2, $3)`, 
                    pool, 'Checking apple authentication status', version,
                    [appleIdTokenClaims.email, req.body.id_token, 1])

                if(qryRes.rows.length != 1 || !qryRes.rows[0].update_external_auth_status || ![1, 2].includes(qryRes.rows[0].update_external_auth_status)) {
                    res.status(500).json({ error: 'UNEXPECTED_INTERNAL_AUTH_STATUS_RETURN_CODE' })
                    return
                }

                if(qryRes.rows[0].update_external_auth_status === 1) {
                    res.status(500).json({ error: 'NO_ACCOUNT', idToken: req.body.id_token })
                    return
                }
                res.send({ idToken: req.body.id_token })
            } catch (e) {
                loggers[version].error('Error checking id_token / nonce when connecting with Apple', e)
                res.status(500).send({ error: 'Verification failed' })
            }
        } else {
            res.status(422).send({ error: 'Missing parameter' })
        }
    })
}