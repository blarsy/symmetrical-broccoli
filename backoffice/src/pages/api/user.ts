import { create } from '@/server/noco'
import { getToken, respondWithFailure, respondWithSuccess } from '@/server/respond'
import { NextRequest } from 'next/server'
import bcrypt from 'bcrypt'
import { getJwt, queryAccount } from '@/server/apiutil'
import { NextApiRequest, NextApiResponse } from 'next'

const INITIAL_BALANCE = 5

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
      const salt = await bcrypt.genSalt()
      const hash = await bcrypt.hash(password, salt)
      await create('comptes', { email, nom: name, salt, hash, balance: INITIAL_BALANCE  })
      respondWithSuccess(res)
    } catch(e: any) {
      respondWithFailure(req, res, e)
    }
  } else {
    respondWithFailure(req, res, new Error('Not implemented'), 405)
  }
}