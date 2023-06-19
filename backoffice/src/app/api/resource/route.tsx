import { getAccount, getJwt, queryAccount } from "@/apiutil"
import { create, link } from "@/noco"
import { createFailureResponse, createSuccessResponse } from "@/respond"
import { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization') as string
        const jwt = await getJwt(token)
        const account = await queryAccount(`(email,eq,${jwt.email})`, ['Id', 'ressources'])
        return createSuccessResponse(account.resources)
    } catch(e: any) {
        return createFailureResponse(request, e)
    }
}

export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization') as string
        const { title, description, expiration } = await request.json()

        const res = await create('ressources', { titre: title , description, expiration })
        const account = await getAccount(token)
        await link('comptes', account.id, 'ressources', res.Id)
        return createSuccessResponse(res)
    } catch(e: any) {
        return createFailureResponse(request, e)
    }
}