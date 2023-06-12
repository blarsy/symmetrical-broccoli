import { getJwt, queryAccount } from "@/apiutil"
import { create } from "@/noco"
import { createFailureResponse, createSuccessResponse } from "@/respond"
import { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
    try {
        const token = request.nextUrl.searchParams.get('token') as string
        const jwt = await getJwt(token)
        const account = await queryAccount(`(email,eq,${jwt.email})`, ['Id', 'ressources'])
        return createSuccessResponse(account.resources)
    } catch(e: any) {
        return createFailureResponse(e)
    }

}

export async function POST(request: NextRequest) {
    try {
        const { title, description, status, expiration } = await request.json()
        const res = await create('ressources', { titre: title , description, status, expiration })
        return createSuccessResponse(res)
    } catch(e: any) {
        return createFailureResponse(e)
    }
}