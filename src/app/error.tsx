"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="stadium relative flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="display text-6xl font-bold text-live">Something broke</div>
      <p className="mt-3 text-muted">A wild delivery. Try again — the auction state is safe on the server.</p>
      <button onClick={reset} className="btn-gold mt-6">Try again</button>
    </main>
  );
}
