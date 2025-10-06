import { io, Socket } from "socket.io-client";
import { EVENTS } from "@/../../../shared/events";

const WS_URL = import.meta.env.VITE_WS_URL || "http://localhost:3000";

export const socket: Socket = io(WS_URL, {
    autoConnect: false,
    transports: ["websocket"],
});

type Pending = { event: string; payload: any; ack?: (response: any) => void };
const pending: Pending[] = [];

socket.on("connect", () => {
    while (pending.length) {
        const { event, payload, ack } = pending.shift()!;
        if (ack) socket.emit(event, payload, ack);
        else socket.emit(event, payload);
    }
});

export function connectToBoard(boardId: string) {
    if (!socket.connected) socket.connect();
    socket.emit(EVENTS.BOARD_JOIN, { boardId });
}

export function emitWithAck<T = any>(event: string, payload: any, timeoutMs = 5000) {
    return new Promise<T>((resolve, reject) => {
        if (!socket.connected) {
            pending.push({ event, payload, ack: resolve });
            return;
        }

        socket.timeout(timeoutMs).emit(event, payload, (err: unknown, res: T) => {
            if (err) return reject(err);
            resolve(res);
        });
    });
}

export const on = socket.on.bind(socket);
export const off = socket.off.bind(socket);
