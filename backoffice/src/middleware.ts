import { NextRequest, NextResponse } from "next/server"

const allowedOriginsStr = process.env.NEXT_PUBLIC_APP_URLS as string
const allowedOrigins = JSON.parse(allowedOriginsStr) as string[]

export const getAllowedOrigin = (originFromHeader: string | null | undefined) => {
    if(!originFromHeader) return allowedOrigins[0]
    const soleOriginToAllow = allowedOrigins.find(ao => ao.toLowerCase().startsWith(originFromHeader!.toLowerCase()))
    return soleOriginToAllow || allowedOrigins[0]
}

export function middleware(req: NextRequest) {
    const res= NextResponse.next()

    res.headers.append('Access-Control-Allow-Origin', getAllowedOrigin(req.headers.get('origin')))
    
    // add the CORS headers to the response
    res.headers.append('Access-Control-Allow-Credentials', "true")
    res.headers.append('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT')
    res.headers.append(
        'Access-Control-Allow-Headers', 
        'Authorization,X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    )

    return res
}