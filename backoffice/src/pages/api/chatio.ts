import { NextApiResponseServerIO } from "@/types/next"
import { NextApiRequest } from "next"
import { Server as ServerIO } from "socket.io"
import { getAllowedOrigin } from "@/middleware"
import { respondWithFailure } from "@/server/respond"
import logger from "@/server/logger"
import { getAccount } from "@/server/apiutil"
import { setMessageRead } from "@/server/dal/participant"

const secret = process.env.JWT_SECRET as string

export const config = {
    api: {
        bodyParser: false,
    },
}

export default async function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
    try {
        if(req.method === 'GET') {
            if (!res.socket.server.io) {
                const io = new ServerIO(res.socket.server as any, {
                    path: '/api/chatio/io',
                    addTrailingSlash: false,
                    cors: {
                        origin: `${getAllowedOrigin(req.headers.origin)}`,
                        methods: ['GET']
                    }
                })
                io.use(async (socket, next) => {
                    logger.info(`Socket connection attempt, with token '${socket.handshake.auth.token}'`)
                    if(socket.handshake.auth.token) {
                        try {
                            if(!socket.data.account){
                                socket.data.account = await getAccount(socket.handshake.auth.token)
                            }
                            next()
                        } catch(e: any) {
                            next(e)
                        }
                        return
                    }
                    next(new Error('Unauthorized'))
                })

                io.on('connection', socket => {
                    socket.on('read_message', async (token: string, messageId:number) => {
                        try {
                            return setMessageRead(token, messageId)
                        } catch (e: any) {
                            return e.toString()
                        }
                    })
                })

                // append SocketIO server to Next.js socket server response
                res.socket.server.io = io
                logger.info('Socket server started')
            }
        }
        res.end()
    } catch(e: any) {
        respondWithFailure(req, res, e)
    }
}