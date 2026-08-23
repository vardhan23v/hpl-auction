/* Download Drive photos referenced as photoUrl "drive:<id>" into public/players and update the DB. */
import { PrismaClient } from "@prisma/client";
import fs from "fs"; import path from "path"; import { execFileSync } from "child_process";
const prisma = new PrismaClient();
async function main() {
  const players = await prisma.player.findMany({ where: { photoUrl: { startsWith: "drive:" } } });
  let ok = 0;
  for (const p of players) {
    const id = p.photoUrl!.slice(6);
    const tmp = path.join("public/players", `${id}.tmp`); const out = path.join("public/players", `${p.id}.jpg`);
    try {
      execFileSync("curl", ["-sL", "-o", tmp, `https://drive.google.com/uc?export=download&id=${id}`]);
      // resize + convert to jpeg (max 800px) using macOS sips; falls back to raw copy
      try { execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "80", "-Z", "800", tmp, "--out", out], { stdio: "ignore" }); } catch { fs.copyFileSync(tmp, out); }
      fs.unlinkSync(tmp);
      if (fs.statSync(out).size < 1000) throw new Error("not an image");
      await prisma.player.update({ where: { id: p.id }, data: { photoUrl: `/players/${p.id}.jpg` } });
      ok++;
    } catch (e) { console.log("FAILED", p.name, (e as Error).message); }
  }
  console.log(`Attached ${ok}/${players.length} photos`);
}
main().finally(() => prisma.$disconnect());
