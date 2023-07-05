import bcrypt from 'bcrypt'
import { createToken, queryAccount } from '@/server/apiutil'
import { NextApiRequest, NextApiResponse } from 'next'
import { respondWithFailure, respondWithSuccess } from '@/server/respond'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if(req.method === 'POST') {
    try {
      const { email, password } = req.body
      
      const account = await queryAccount(`(email,eq,${email})`, ['Id', 'nom', 'email', 'balance', 'hash'])
      const success = await bcrypt.compare(password, account.hash)
      if(success) {
        const token = await createToken(process.env.JWT_SECRET as string, { email })
        // make sure we don't return the hash to the client
        const accountToReturn = {
          id: account.id, name: account.name, balance: account.balance,
          email: account.email
        }
        respondWithSuccess(res, { token, account: accountToReturn })
        return
      }
      respondWithFailure(req, res, 'Auth failed')
    } catch(e: any) {
      respondWithFailure(req, res, e)
    }
  } else {
    res.status(405).end()
  }
}