import { NextRequest, NextResponse } from "next/server"
import logger from "./logger"

const headers = {
    'Access-Control-Allow-Origin': JSON.parse(process.env.NEXT_PUBLIC_APP_URLS as string)
  }

export const createSuccessResponse = (body?: object): NextResponse => {
    return new NextResponse(body && JSON.stringify(body), {
        status: 200,
        headers
      })
}

export const createFailureResponse = (req: NextRequest, error: any, statusCode: number = 500): NextResponse => {
    try{
      logger.error(`Exception during request processing: path: ${req.url}`, error)
    } finally {
      return new NextResponse(error.toString(), {
        status: statusCode,
        headers
      })
    }
}