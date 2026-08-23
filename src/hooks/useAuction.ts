"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { getSocket } from "@/lib/socket-client";
import type { AuctionSnapshot } from "@/types/auction";

export interface FlashEvent { kind: "SOLD" | "UNSOLD"; playerName: string; teamName?: string; teamColor?: string; amount?: number; id: number }

export function useAuction(initial?: AuctionSnapshot | null) {
  const [snap, setSnap] = useState<AuctionSnapshot | null>(initial ?? null);
  const [connected, setConnected] = useState(false);
  const [clients, setClients] = useState(0);
  const [flash, setFlash] = useState<FlashEvent | null>(null);
  const [lastRejection, setLastRejection] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const offset = useRef(0); // serverTime - clientTime

  useEffect(() => {
    const s = getSocket();
    const onSnap = (p: { snapshot?: AuctionSnapshot }) => { if (p?.snapshot) { setSnap(p.snapshot); offset.current = p.snapshot.serverTime - Date.now(); } };
    const events = ["state:sync","auction:started","auction:paused","auction:resumed","auction:completed","player:started","player:skipped","player:next","bid:accepted","timer:updated","team:purseUpdated","auction:undo"];
    events.forEach((e) => s.on(e, onSnap));
    s.on("player:sold", (p: { playerName: string; teamName: string; teamColor: string; amount: number; snapshot: AuctionSnapshot }) => { onSnap(p); setFlash({ kind: "SOLD", playerName: p.playerName, teamName: p.teamName, teamColor: p.teamColor, amount: p.amount, id: Date.now() }); });
    s.on("player:unsold", (p: { playerName: string; snapshot: AuctionSnapshot }) => { onSnap(p); setFlash({ kind: "UNSOLD", playerName: p.playerName, id: Date.now() }); });
    s.on("bid:rejected", (p: { error: string }) => setLastRejection(p.error));
    s.on("presence", (p: { clients: number }) => setClients(p.clients));
    s.on("time", (p: { serverTime: number }) => { offset.current = p.serverTime - Date.now(); });
    s.on("connect", () => { setConnected(true); s.emit("state:request"); });
    s.on("disconnect", () => setConnected(false));
    if (s.connected) { setConnected(true); s.emit("state:request"); }
    const tick = setInterval(() => setNow(Date.now() + offset.current), 200);
    return () => { events.forEach((e) => s.off(e, onSnap)); s.off("player:sold"); s.off("player:unsold"); s.off("bid:rejected"); s.off("presence"); s.off("time"); clearInterval(tick); };
  }, []);

  useEffect(() => { if (!flash) return; const t = setTimeout(() => setFlash(null), 4500); return () => clearTimeout(t); }, [flash]);

  const placeBid = useCallback((amount?: number) => new Promise<{ ok: boolean; error?: string }>((resolve) => {
    getSocket().emit("bid:place", { amount }, (r: { ok: boolean; error?: string }) => { if (!r.ok) setLastRejection(r.error ?? "Rejected"); resolve(r); });
  }), []);

  const remainingMs = snap ? (snap.timerRunning && snap.timerEndsAt ? Math.max(0, snap.timerEndsAt - now) : (snap.timerRemainingMs ?? (snap.state === "PLAYER_LIVE" ? snap.timerSeconds * 1000 : 0))) : 0;
  const nextBid = snap ? (snap.currentBid === 0 ? (snap.currentPlayer?.basePrice ?? 0) : snap.currentBid + snap.bidIncrement) : 0;

  return { snap, connected, clients, flash, lastRejection, clearRejection: () => setLastRejection(null), placeBid, remainingMs, nextBid };
}
