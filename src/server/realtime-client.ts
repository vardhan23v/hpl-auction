/** When REALTIME_URL is set (Vercel + Railway split), auction mutations are forwarded to the realtime service. */
export const realtimeUrl = process.env.REALTIME_URL?.replace(/\/$/, "");
export async function forwardControl(action: string, playerId?: string): Promise<{ status: number; body: Record<string, unknown> }> {
  const r = await fetch(`${realtimeUrl}/control`, { method: "POST", headers: { "Content-Type": "application/json", "x-realtime-secret": process.env.REALTIME_SECRET ?? "" }, body: JSON.stringify({ action, playerId }), cache: "no-store" });
  return { status: r.status, body: await r.json() };
}
