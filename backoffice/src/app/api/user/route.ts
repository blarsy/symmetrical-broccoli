import { create } from '@/noco'
import { createSuccessResponse, createFailureResponse } from '@/respond'
import { NextRequest } from 'next/server'
import bcrypt from 'bcrypt'

const INITIAL_BALANCE = 5

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()
    const salt = await bcrypt.genSalt()
    const hash = await bcrypt.hash(password, salt)
    create('comptes', { email, nom: name, salt, hash, balance: INITIAL_BALANCE  })
    return createSuccessResponse()
  } catch(e: any) {
    return createFailureResponse(e)
  }
}