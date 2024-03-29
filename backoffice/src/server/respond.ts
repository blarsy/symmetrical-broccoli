import logger from "./logger"
import { NextApiRequest, NextApiResponse } from "next"

export const getToken = (req: NextApiRequest): string => {
  if(!req.headers.authorization) {
    throw new Error('Unauthenticated')
  }
  return req.headers.authorization
}

export const respondWithSuccess = (res: NextApiResponse, body?: object): void => {
  res.status(200).json(body)
}

const reqToString = (req: NextApiRequest) => `${req.method} path:${req.url} headers:${JSON.stringify(req.headers)} query:  ${JSON.stringify(req.query)} body:${req.body}`
export const respondWithFailure = (req: NextApiRequest, res: NextApiResponse, error: any, statusCode: number = 500): void => {
    try{
      logger.error(`Exception during request processing: req: ${reqToString(req)}`, error)
    } finally {
      res.status(statusCode).send(error.toString ? error.toString(): error)
    }
}