function SeverityBadge({ severity }) {
  const styles = {
    minor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    moderate: 'bg-amber-100 text-amber-950 border-amber-300',
    major: 'bg-rose-100 text-rose-950 border-rose-300',
    unknown: 'bg-slate-100 text-slate-800 border-slate-300',
  }[severity] || 'bg-slate-100 text-slate-800 border-slate-300';

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${styles}`}
    >
      Preliminary severity: {severity}
    </span>
  );
}

export default function DocumentationReport({ assessment, onClear }) {
  if (!assessment) return null;

  const isSample = assessment.mode === 'sample';
  const createdDate = new Date(assessment.createdAt).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <article
      className="panel report mb-8 overflow-hidden border border-emerald-900/20 bg-white p-6 shadow-sm sm:p-8"
      aria-labelledby="report-heading"
    >
      {/* Mode / Provenance Banner */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-emerald-900/10 pb-4">
        <div>
          {isSample ? (
            <div data-provenance="sample" className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-950">
              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
              <span>SAMPLE · Pre-written illustrative fixture</span>
            </div>
          ) : (
            <div data-provenance="live" className="inline-flex items-center gap-1.5 rounded-md border border-blue-300 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-950">
              <span className="h-2 w-2 rounded-full bg-blue-500"></span>
              <span>LIVE AI INFERENCE · Model: {assessment.model}</span>
            </div>
          )}
          <p className="mt-1 text-xs text-emerald-900/90">
            {isSample
              ? 'This is a pre-written illustrative fixture, not an automated AI inference.'
              : 'Provisional observations generated from uploaded photo. Requires licensed on-site inspection.'}
          </p>
        </div>

        <div className="no-print flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5"
            title="Print this report or save as a PDF"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.72 13.829c-.24-1.206-.443-2.433-.604-3.673a55.772 55.772 0 0111.768 0c-.161 1.24-.364 2.467-.604 3.673M6 18.75h12m-12-6h12m-9-6h6a1.5 1.5 0 011.5 1.5v3H7.5v-3A1.5 1.5 0 019 6.75z"
              />
            </svg>
            <span>Print report / Save PDF</span>
          </button>
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="secondary text-xs px-3 py-1.5 text-emerald-900"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Report Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="report-heading" className="text-2xl font-bold tracking-tight text-emerald-950">
            Property Documentation Draft
          </h2>
          <SeverityBadge severity={assessment.severity} />
        </div>
        <p className="mt-2 text-base leading-relaxed text-emerald-950">
          {assessment.summary}
        </p>
      </div>

      {/* Grid of Findings */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Observations */}
        <section className="rounded-lg border border-emerald-900/10 bg-emerald-50/20 p-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-950 m-0">
            Visible Observations
          </h3>
          <ul className="mt-2 space-y-1.5 text-sm text-emerald-900/90 pl-5">
            {assessment.observations.map((item, idx) => (
              <li key={idx} className="leading-snug">{item}</li>
            ))}
          </ul>
        </section>

        {/* Hazards */}
        <section className="rounded-lg border border-amber-900/15 bg-amber-50/30 p-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-950 m-0">
            Potential Concerns & Hazards
          </h3>
          <ul className="mt-2 space-y-1.5 text-sm text-amber-900/90 pl-5">
            {assessment.hazards.map((item, idx) => (
              <li key={idx} className="leading-snug">{item}</li>
            ))}
          </ul>
        </section>

        {/* Next Steps */}
        <section className="rounded-lg border border-emerald-900/10 bg-emerald-50/20 p-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-950 m-0">
            Recommended Next Steps
          </h3>
          <ul className="mt-2 space-y-1.5 text-sm text-emerald-900/90 pl-5">
            {assessment.nextSteps.map((item, idx) => (
              <li key={idx} className="leading-snug">{item}</li>
            ))}
          </ul>
        </section>

        {/* Limitations & Provenance */}
        <section className="rounded-lg border border-slate-300 bg-slate-50 p-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 m-0">
            Limitations & Scope
          </h3>
          <ul className="mt-2 space-y-1.5 text-xs text-slate-700 pl-5">
            {assessment.limitations.map((item, idx) => (
              <li key={idx} className="leading-snug">{item}</li>
            ))}
          </ul>
        </section>
      </div>

      {/* Metadata Footer */}
      <div className="mt-6 border-t border-emerald-900/10 pt-4 flex flex-wrap items-center justify-between text-xs text-emerald-900/90">
        <div>
          <span>Document ID: </span>
          <code className="font-mono text-emerald-900">{assessment.id}</code>
        </div>
        <div>
          <span>Generated: </span>
          <time dateTime={assessment.createdAt} className="font-medium text-emerald-950">
            {createdDate}
          </time>
        </div>
      </div>
    </article>
  );
}
