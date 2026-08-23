import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { guard, parse, handle, json, audit } from "@/lib/api";
import bcrypt from "bcryptjs";

const schema = z.object({
  name: z.string().min(2).max(40).optional(),
  abbreviation: z.string().min(2).max(5).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  logoUrl: z.string().regex(/^(https?:\/\/|\/)/, "must be a URL or /path").nullable().optional().or(z.literal("")),
  captainName: z.string().max(60).nullable().optional(),
  captainEmail: z.string().email().nullable().optional().or(z.literal("")),
  captainPassword: z.string().min(6).optional(),
  isDummy: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("ADMIN"); if ("error" in g) return g.error;
  try {
    const { id } = await params;
    const { captainPassword, ...data } = await parse(req, schema);
    const team = await prisma.team.update({ where: { id }, data: { ...data, logoUrl: data.logoUrl === "" ? null : data.logoUrl, captainEmail: data.captainEmail === "" ? null : data.captainEmail?.toLowerCase() } });
    // Keep the captain user in sync with team captain details.
    if (team.captainEmail) {
      const existing = await prisma.user.findUnique({ where: { teamId: id } });
      const hash = captainPassword ? await bcrypt.hash(captainPassword, 10) : undefined;
      if (existing) {
        await prisma.user.update({ where: { id: existing.id }, data: { name: team.captainName ?? existing.name, email: team.captainEmail, ...(hash ? { passwordHash: hash } : {}) } });
      } else {
        const byEmail = await prisma.user.findUnique({ where: { email: team.captainEmail } });
        if (byEmail) await prisma.user.update({ where: { id: byEmail.id }, data: { role: "CAPTAIN", teamId: id, name: team.captainName ?? byEmail.name, ...(hash ? { passwordHash: hash } : {}) } });
        else await prisma.user.create({ data: { name: team.captainName ?? team.name + " Captain", email: team.captainEmail, role: "CAPTAIN", teamId: id, passwordHash: hash ?? (await bcrypt.hash(captainPassword ?? "hpl" + Math.random().toString(36).slice(2, 8), 10)) } });
      }
    }
    await audit(g.session.user.id, "TEAM_UPDATE", "Team", id, data);
    const { realtimeUrl, forwardControl } = await import("@/server/realtime-client");
    if (realtimeUrl) await forwardControl("BROADCAST").catch(() => {});
    else { const { emit } = await import("@/server/emit"); await emit("team:purseUpdated", { teamId: id }); }
    return json(team);
  } catch (e) { return handle(e); }
}
