import { createFailureResponse, createSuccessResponse } from "@/respond"
import { NextRequest } from "next/server"
import { JwtPayload, verify } from "jsonwebtoken"
import { list } from '@/noco'

const getJwt = async (token: string, secret: string): Promise<JwtPayload> => {
    return new Promise((resolve, reject) => {
        verify(token, secret, (err, payload) => {
            if(err) reject(err)
            else resolve(payload as JwtPayload)
        })
    })
}

export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
    try {
        const jwt = await getJwt(params.token, process.env.JWT_SECRET as string)
        const accounts = await list('comptes', `(email,eq,${jwt.email})`)
        return createSuccessResponse({ account: accounts[0] })
    } catch(e: any) {
        return createFailureResponse(e)
    }

}