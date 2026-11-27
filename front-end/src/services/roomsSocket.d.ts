import type { Socket } from 'socket.io-client'

export const roomsSocket: Socket

export function conectarRoomsSocket(): void

export function desconectarRoomsSocket(): void
