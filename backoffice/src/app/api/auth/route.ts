import { list } from '@/noco'
import { createSuccessResponse, createFailureResponse } from '@/respond'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { sign } from 'jsonwebtoken'

const createToken = async (secret: string, data: any): Promise<string> => {
  return new Promise((resolve, reject) => {
    data.exp = Date.now() / 1000 + (60 * 60 * 24 * 2)
    sign(data, secret, (err: Error | null, token?: string) => {
      if(err) reject(err)
      resolve(token!)
    })
  })
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { email, password } = await request.json()

    const account = await list('comptes', `(email,eq,${email})`)
    if(account.length === 1) {
      const success = await bcrypt.compare(password, account[0].hash)
      if(success) {
        const token = await createToken(process.env.JWT_SECRET as string, { email })
        return createSuccessResponse({ token })
      }
    }
    return createFailureResponse('Auth failed')
  } catch(e: any) {
    return createFailureResponse(e)
  }
}