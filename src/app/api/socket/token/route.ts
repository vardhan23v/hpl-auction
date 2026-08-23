import { encode } from "next-auth/jwt";
import { getSession } from "@/lib/auth";
import { json } from "@/lib/api";
export const dynamic = "force-dynamic";
/** Short-lived token so the browser can authenticate to the realtime service on another domain. */
export async function GET() {
  const s = await getSession();
  const url = process.env.NEXT_PUBLIC_SOCKET_URL ?? "";
  if (!s?.user) return json({ token: null, url });
  const token = await encode({ secret: process.env.NEXTAUTH_SECRET!, maxAge: 60 * 60 * 6, token: { uid: s.user.id, role: s.user.role, teamId: s.user.teamId } });
  return json({ token, url });
}
