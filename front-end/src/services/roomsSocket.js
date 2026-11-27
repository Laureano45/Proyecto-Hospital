import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL

export const roomsSocket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket'],
  auth: {
    token: localStorage.getItem('token'),
  },
})

export function conectarRoomsSocket() {
  roomsSocket.auth = {
    token: localStorage.getItem('token'),
  }
  if (!roomsSocket.connected) {
    roomsSocket.connect()
  }
}

export function desconectarRoomsSocket() {
  if (roomsSocket.connected) {
    roomsSocket.disconnect()
  }
}
