import { NextApiRequest, NextApiResponse } from 'next'
import { respondWithFailure, respondWithSuccess } from '@/server/respond'
import { authenticate } from '@/server/dal/user'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if(req.method === 'POST') {
    try {
      const { email, password } = req.body
      
      const result = await authenticate(email, password)

      respondWithSuccess(res, result)
    } catch(e: any) {
      respondWithFailure(req, res, e)
    }
  } else {
    res.status(405).end()
  }
}