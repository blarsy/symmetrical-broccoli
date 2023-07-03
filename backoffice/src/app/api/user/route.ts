import { create } from '@/server/noco'
import { createSuccessResponse, createFailureResponse } from '@/server/respond'
import { NextRequest } from 'next/server'
import bcrypt from 'bcrypt'
import { getJwt, queryAccount } from '@/server/apiutil'

const INITIAL_BALANCE = 5

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()
    const salt = await bcrypt.genSalt()
    const hash = await bcrypt.hash(password, salt)
    await create('comptes', { email, nom: name, salt, hash, balance: INITIAL_BALANCE  })
    return createSuccessResponse()
  } catch(e: any) {
    return createFailureResponse(request, e)
  }
}

export async function GET(request: NextRequest) {
  try {
      const jwt = await getJwt(request.headers.get('Authorization') as string)
      const account = await queryAccount(`(email,eq,${jwt.email})`)
      return createSuccessResponse({ account })
  } catch(e: any) {
      return createFailureResponse(request, e)
  }
}