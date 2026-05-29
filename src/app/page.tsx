import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-dark)] flex items-center justify-center text-3xl mx-auto mb-6 shadow-2xl shadow-black/25">
          🎵
        </div>
        <h1 className="text-4xl font-bold text-stone-50 mb-3 tracking-tight">ListenedTo</h1>
        <p className="text-stone-400 mb-10 leading-relaxed">
          Rate albums en nummers. Deel je smaak.<br />
          Ontdek wat vrienden luisteren.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/registreer"
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-text)] font-bold rounded-2xl px-7 py-3 transition-colors shadow-lg shadow-black/25"
          >
            Aan de slag
          </Link>
          <Link
            href="/login"
            className="bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold rounded-2xl px-7 py-3 transition-colors border border-stone-700"
          >
            Inloggen
          </Link>
        </div>
      </div>
    </div>
  );
}
