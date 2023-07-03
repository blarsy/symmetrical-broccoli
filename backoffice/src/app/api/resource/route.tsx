import { getAccount, getJwt, queryAccount } from "@/server/apiutil"
import { bulkCreate, create, link } from "@/server/noco"
import { createFailureResponse, createSuccessResponse } from "@/server/respond"
import { conditionsToRaw } from "@/schema"
import { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization') as string
        const jwt = await getJwt(token)
        const account = await queryAccount(`(email,eq,${jwt.email})`, ['Id', 'ressources'])
        
        return createSuccessResponse(account.resources)
    } catch(e: any) {
        return await createFailureResponse(request, e)
    }
}

export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization') as string
        const { title, description, expiration, conditions } = await request.json()

        const res = await create('ressources', { titre: title , description, expiration })
        const account = await getAccount(token)
        await link('comptes', account.id, 'ressources', res.Id)

        const conditionsRes = await bulkCreate('conditions', conditionsToRaw(conditions))
        
        await Promise.all(conditionsRes.map(async (condition: any) => {
            return link('ressources', res.Id, 'conditions', condition.id)
        }))

        return createSuccessResponse(res)
    } catch(e: any) {
        return await createFailureResponse(request, e)
    }
}