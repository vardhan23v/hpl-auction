import Link from "next/link";
export default function NotFound() {
  return (
    <main className="stadium relative flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="display text-9xl font-bold text-gold">404</div>
      <div className="display mt-2 text-3xl">Played and missed.</div>
      <p className="mt-2 text-muted">This page isn&rsquo;t in the squad.</p>
      <div className="mt-6 flex gap-3"><Link href="/" className="btn-gold">Back to home</Link><Link href="/live" className="btn-ghost">Watch the auction</Link></div>
    </main>
  );
}
