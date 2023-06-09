import { NextResponse } from "next/server"

const headers = {
    'Access-Control-Allow-Origin': JSON.parse(process.env.NEXT_PUBLIC_APP_URLS as string)
  }

export const createSuccessResponse = (body?: object): NextResponse => {
    return new NextResponse(body && JSON.stringify(body), {
        status: 200,
        headers
      })
}

export const createFailureResponse = (error: any): NextResponse => {
    return new NextResponse(JSON.stringify(error), {
        status: 500,
        headers
      })
}