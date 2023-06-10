import { createFailureResponse, createSuccessResponse } from "@/respond"
import { NextRequest } from "next/server"
import { getJwt, queryAccount } from "@/apiutil"

export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
    try {
        const jwt = await getJwt(params.token)
        const account = await queryAccount(`(email,eq,${jwt.email})`)
        return createSuccessResponse({ account })
    } catch(e: any) {
        return createFailureResponse(e)
    }

}