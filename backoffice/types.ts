import { NextApiResponse } from "next"
import { Server as NetServer, Socket } from "net"
import { Server } from 'socket.io'

export type NextApiResponseServerIo = NextApiResponse & {
    socket: Socket & {
      server: NetServer & {
        io: Server
      }
    }
  }