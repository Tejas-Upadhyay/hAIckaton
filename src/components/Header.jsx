export default function Header() {
  return (
    <header className="mb-8 border-b border-emerald-900/10 pb-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow text-emerald-800 font-semibold tracking-wider">
            Southwest Florida · Lee · Collier · Charlotte
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-emerald-950 sm:text-4xl">
            StormGuard AI
          </h1>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-900/15 bg-white/80 px-3.5 py-1 text-xs font-medium text-emerald-900 shadow-sm backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600"></span>
          </span>
          <span>Provisional Property Documentation</span>
        </div>
      </div>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-emerald-900/80 sm:text-base">
        Document visible storm impact to prepare an organized, printable preliminary report for your insurance claim, FEMA documentation, or licensed contractor review.
      </p>
    </header>
  );
}
