"use client";
import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;
/** Connects to the realtime service. Cross-domain (Vercel + Railway) uses a token from /api/socket/token; same-origin uses the session cookie. */
export function getSocket(): Socket {
  if (!socket) {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL || undefined;
    socket = io(url, { path: "/socket.io", withCredentials: true, transports: ["websocket", "polling"], reconnection: true, reconnectionDelay: 500, autoConnect: false });
    const s = socket;
    fetch("/api/socket/token").then((r) => r.json()).then((j: { token: string | null }) => { s.auth = j.token ? { token: j.token } : {}; s.connect(); }).catch(() => s.connect());
    // Refresh the token on reconnect attempts so an expired one doesn't lock a captain out.
    s.io.on("reconnect_attempt", () => { fetch("/api/socket/token").then((r) => r.json()).then((j: { token: string | null }) => { s.auth = j.token ? { token: j.token } : {}; }).catch(() => {}); });
  }
  return socket;
}
