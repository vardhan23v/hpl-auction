"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { roleHome } from "@/lib/auth-client";
import { NotificationBell } from "./NotificationBell";

export function Nav() {
  const { data } = useSession();
  const u = data?.user;
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-pitch/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="display text-lg font-bold tracking-widest">
          <span className="text-gold">HPL</span> <span className="hidden sm:inline">Hostel Premier League</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link href="/live" className="rounded-md px-3 py-1.5 hover:bg-panel-2"><span className="live-dot mr-1.5 inline-block h-2 w-2 rounded-full bg-live" />Live</Link>
          <Link href="/players" className="rounded-md px-3 py-1.5 hover:bg-panel-2">Players</Link>
          <Link href="/squads" className="hidden rounded-md px-3 py-1.5 hover:bg-panel-2 sm:inline">Squads</Link>
          <Link href="/history" className="hidden rounded-md px-3 py-1.5 hover:bg-panel-2 sm:inline">History</Link>
          <Link href="/analytics" className="hidden rounded-md px-3 py-1.5 hover:bg-panel-2 md:inline">Analytics</Link>
          <Link href="/results" className="hidden rounded-md px-3 py-1.5 hover:bg-panel-2 md:inline">Results</Link>
          <Link href="/register" className="hidden rounded-md px-3 py-1.5 hover:bg-panel-2 md:inline">Register</Link>
          {u ? (
            <>
              <NotificationBell />
              <Link href={roleHome(u.role)} className="btn-ghost !px-3 !py-1.5">{u.role === "CAPTAIN" ? "My Team" : u.role[0] + u.role.slice(1).toLowerCase()}</Link>
              <button onClick={() => signOut({ callbackUrl: "/" })} className="px-2 text-muted hover:text-ink">Logout</button>
            </>
          ) : (
            <Link href="/login" className="btn-gold !px-3 !py-1.5">Team Login</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
