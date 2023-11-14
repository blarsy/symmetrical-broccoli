import { getToken, respondWithFailure, respondWithSuccess } from '@/server/respond'
import { getJwt, queryAccount } from '@/server/apiutil'
import { NextApiRequest, NextApiResponse } from 'next'
import { authenticate, create, updateAccount } from '@/server/dal/user'
import { DUPLICATE_EMAIL, DUPLICATE_NAME } from '@/utils'


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if(req.method === 'GET') {
    try {
      const jwt = await getJwt(getToken(req))
      const account = await queryAccount(`(email,eq,${jwt.email})`)
      respondWithSuccess(res, { account })
    } catch(e: any) {
      respondWithFailure(req, res, e)
    }
  } else if(req.method === 'POST') {
    try {
      const { name, email, password } = await req.body
      const lcaseEmail = (email as string).toLowerCase()
      await create(name, lcaseEmail, password)
      const auth = await authenticate(lcaseEmail, password)
      respondWithSuccess(res, auth)
    } catch(e: any) {
      const error = e as Error
      
      if(error.cause === DUPLICATE_EMAIL) {
        respondWithFailure(req, res, DUPLICATE_EMAIL, 409)
      } else if(error.cause === DUPLICATE_NAME) {
        respondWithFailure(req, res, DUPLICATE_NAME, 409)
      } else {
        respondWithFailure(req, res, e)
      }
    }
  } else if(req.method === 'PATCH') {
    try {
        const { password, newPassword, name, email } = req.body
        const lcaseEmail = (email as string).toLowerCase()
        const updatedAccount = await updateAccount(getToken(req), password, newPassword, name, lcaseEmail)
        respondWithSuccess(res, updatedAccount)
    } catch (e: any) {
        respondWithFailure(req, res, e)
    }
  } else {
    res.end()
  }
}