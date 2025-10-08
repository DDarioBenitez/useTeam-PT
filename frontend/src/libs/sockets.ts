import { io, Socket } from "socket.io-client";
import { EVENTS } from "../shared/events";
import { VITE } from "./env";

// mi namespace es "boards"  => cliente va a "/boards"
const WS_URL = VITE.WS_URL ?? "http://localhost:3000/boards";
console.log("[WS] connecting to:", WS_URL);

export const socket: Socket = io(WS_URL, {
    autoConnect: false,
    transports: ["websocket"],
    withCredentials: false,
});

type Pending = { event: string; payload: unknown; ack?: (response: unknown) => void };
const pending: Pending[] = [];

socket.on("connect", () => {
    while (pending.length) {
        const { event, payload, ack } = pending.shift()!;
        if (ack) socket.emit(event, payload, ack as unknown as (...args: unknown[]) => void);
        else socket.emit(event, payload as unknown as Record<string, unknown>);
    }
    console.log("[WS] connected!", socket.id);
});

export function connectToBoard() {
    if (!socket.connected) socket.connect();
    socket.emit(EVENTS.BOARD_JOIN, {});
}

export const on = socket.on.bind(socket);
export const off = socket.off.bind(socket);
