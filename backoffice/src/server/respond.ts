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

export const respondWithFailure = (req: NextApiRequest, res: NextApiResponse, error: any, statusCode: number = 500): void => {
  if(error.name === 'TokenExpiredError') {
    //Signal expiry with a specific, easy to handle, response
    res.status(401).send('TOKEN_EXPIRED')
  } else {
    try{
      logger.error(`Exception during request processing: path: ${req.url}`, error)
    } finally {
      res.status(statusCode).send(error.toString ? error.toString(): error)
    }
  }
}