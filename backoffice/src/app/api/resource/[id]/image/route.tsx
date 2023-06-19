import { getAccount } from "@/apiutil"
import { uploadResourceImage } from "@/noco"
import { createFailureResponse, createSuccessResponse } from "@/respond"
import { NextRequest } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const token = request.headers.get('Authorization') as string
        //check if token is valid and not expired
        const account = await getAccount(token)
        
        const data = await request.formData()
        const file = data.get('file') as Blob

        await uploadResourceImage('ressources/images', account, Number(params.id), file)
        
        return createSuccessResponse()

    } catch(e: any) {
        return createFailureResponse(request, e)
    }
}
