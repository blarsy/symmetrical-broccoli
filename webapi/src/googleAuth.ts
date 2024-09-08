import { json } from "express"
import {Express} from "express-serve-static-core"
import { OAuth2Client } from "google-auth-library"
import { Config, getConnectionString } from "./config"
import logger from "./logger"
import { runAndLog } from "./db_jobs/utils"
const client = new OAuth2Client()

export default (app: Express, config: Config) => {
    app.use(json())
    app.post(`/gauth`, async (req, res) => {
        try {
            // verify the userId at Google
            const loginTicket = await client.verifyIdToken({ idToken: req.body.idToken, audience: config.googleAuthAudience })
            
            const payload = loginTicket.getPayload()
    
            if(! payload) { 
                res.status(500).send({ error: 'Verification from Google did not provide any payload.' })
                return
            }
    
            // Issue a JWT token
            const email = loginTicket.getPayload()!.email

            const qryRes = await runAndLog(`SELECT sb.update_google_auth_status ($1, $2)`, 
                getConnectionString(config), 'Checking Google authentication status', 
                [email, req.body.idToken])

            if(qryRes.rows.length != 1 || !qryRes.rows[0].update_google_auth_status || ![1, 2].includes(qryRes.rows[0].update_google_auth_status)) {
                res.status(500).json({ error: 'UNEXPECTED_INTERNAL_AUTH_STATUS_RETURN_CODE' })
                return
            }

            if(qryRes.rows[0].update_google_auth_status === 1) {
                res.status(500).json({ error: 'NO_ACCOUNT' })
                return
            }
            res.send()
            
            // if(!mutationRes.data.googleAuthenticate.jwtToken){
            //     res.status(500).send({ error: 'MISSING_NAME' })
            // } else {
            //     res.send({ token: mutationRes.data.googleAuthenticate.jwtToken, email })
            // }
        } catch (e) {
            logger.error('Error authenticating with Google', e)
            res.status(500).send({ error: 'SERVER_ERROR' })
        }
    })
}