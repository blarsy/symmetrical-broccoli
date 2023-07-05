import logger from "./logger"
import { NextApiRequest, NextApiResponse } from "next"

const headerAccessControlAllowOrigin = JSON.parse(process.env.NEXT_PUBLIC_APP_URLS as string)

export const getToken = (req: NextApiRequest): string => {
  if(!req.headers.authorization) {
    throw new Error('Unauthenticated')
  }
  return req.headers.authorization
}

export const respondWithSuccess = (res: NextApiResponse, body?: object): void => {
  res.setHeader("access-control-allow-origin", headerAccessControlAllowOrigin)
  res.status(200).json(body)
}

export const respondWithFailure = (req: NextApiRequest, res: NextApiResponse, error: any, statusCode: number = 500): void => {
    try{
      logger.error(`Exception during request processing: path: ${req.url}`, error)
    } finally {
      res.setHeader("access-control-allow-origin", headerAccessControlAllowOrigin)
      res.status(statusCode).json({ error })
    }
}