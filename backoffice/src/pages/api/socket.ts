import { NextApiRequest } from 'next'
import { Server as NetServer } from 'http'
import { Server } from 'socket.io'
import { NextApiResponseServerIo } from '../../../types'

export default async function SocketHandler(req: NextApiRequest, res: NextApiResponseServerIo) {
    if (!res.socket.server.io){
        const path = "/api/socket/io"
        const httpServer: NetServer = res.socket.server as any
        const io = new Server(httpServer, {
          path: path,
          addTrailingSlash: false,
        })
        res.socket.server.io = io
    }
    res.end()
}