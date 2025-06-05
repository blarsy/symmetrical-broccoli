import { json } from "express"
import {Express} from "express-serve-static-core"
import { OAuth2Client } from "google-auth-library"
import logger from "./logger"
import { runAndLog } from "./db_jobs/utils"
import { Pool } from "pg"
import { CorsRequest } from "cors"

export default (app: Express, pool: Pool, googleAuthAudience: string, googleApiSecret: string, corsMiddleware: (req: CorsRequest, res: {
    statusCode?: number | undefined;
    setHeader(key: string, value: string): any;
    end(): any;
}, next: (err?: any) => any) => void) => {
    const client = new OAuth2Client( googleAuthAudience, googleApiSecret, 'postmessage' )

    app.use(json())
    
    app.post(`/gauth`, corsMiddleware, async (req, res) => {
        try {
            let idToken: string
            if(req.body.code) {
                const { tokens } = await client.getToken(req.body.code)
                idToken = tokens.id_token!
            } else if(req.body.idToken) {
                idToken = req.body.idToken
            } else {
                res.status(422).send({ error: 'Missing parameter' })
                return
            }
            // verify the userId at Google
            const loginTicket = await client.verifyIdToken({ idToken, audience: googleAuthAudience })
                
            const payload = loginTicket.getPayload()

            if(! payload) { 
                res.status(500).send({ error: 'Verification from Google did not provide any payload.' })
                return
            }
    
            // Issue a JWT token
            const email = payload.email

            const qryRes = await runAndLog(`SELECT sb.update_external_auth_status ($1, $2, $3)`, 
                pool, 'Checking Google authentication status', 
                [email, idToken, 0])

            if(qryRes.rows.length != 1 || !qryRes.rows[0].update_external_auth_status || ![1, 2].includes(qryRes.rows[0].update_external_auth_status)) {
                res.status(500).json({ error: 'UNEXPECTED_INTERNAL_AUTH_STATUS_RETURN_CODE' })
                return
            }

            if(qryRes.rows[0].update_external_auth_status === 1) {
                res.status(500).json({ error: 'NO_ACCOUNT', idToken })
                return
            }
            res.send({ idToken })
        } catch (e) {
            logger.error('Error authenticating with Google', e)
            res.status(500).send({ error: 'SERVER_ERROR' })
        }
    })
}