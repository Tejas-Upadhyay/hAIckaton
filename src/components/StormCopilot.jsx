import { useState } from 'react';

const GENERAL_CHECKLIST = [
  { id: 'photos', label: 'Take pre-storm photos of every room, appliances, roof, and vehicles' },
  { id: 'documents', label: 'Seal insurance policies, deed, IDs, and medical records in watertight container' },
  { id: 'shutters', label: 'Review your storm preparation plan and local official instructions' },
  { id: 'water', label: 'Review the official disaster supply checklist for your household' },
  { id: 'generator', label: 'Read manufacturer instructions and official generator safety guidance' },
  { id: 'debris', label: 'Secure or bring indoors patio furniture, trash bins, potted plants, and loose yard debris' },
];

export default function StormCopilot({ services }) {
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [response, setResponse] = useState(null);
  const [copilotError, setCopilotError] = useState('');
  const [checkedItems, setCheckedItems] = useState({});

  async function handleAsk(e) {
    e.preventDefault();
    if (!query.trim() || busy) return;
    setBusy(true);
    setCopilotError('');
    setResponse(null);

    try {
      const res = await services.askCopilot({ message: query.trim(), county: 'Lee' });
      setResponse(res);
    } catch (err) {
      setCopilotError(err.message || 'Live copilot is awaiting backend integration.');
    } finally {
      setBusy(false);
    }
  }

  function toggleCheck(id) {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <section
      className="panel no-print mb-8 border border-emerald-900/15 bg-white p-6"
      aria-labelledby="copilot-heading"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-emerald-900/10 pb-4 mb-4">
        <div>
          <h2 id="copilot-heading" className="text-xl font-bold text-emerald-950 sm:text-2xl m-0">
            Storm Copilot & General Checklist
          </h2>
          <p className="text-xs text-emerald-900/90 mt-1">
            Secondary assistant for disaster preparation and post-storm documentation inquiries.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
          <span className="h-2 w-2 rounded-full bg-amber-500"></span>
          <span>Copilot: Unavailable</span>
        </div>
      </div>

      {/* Ask Copilot Form */}
      <form onSubmit={handleAsk} className="mb-6">
        <label htmlFor="copilot-input" className="text-xs font-semibold text-emerald-950">
          Ask a storm documentation or prep question
        </label>
        <div className="mt-1.5 flex flex-col sm:flex-row gap-2">
          <input
            id="copilot-input"
            type="text"
            maxLength={2000}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., How should I photograph roof damage after a storm?"
            disabled={busy}
            className="flex-1 rounded-lg border border-emerald-900/20 px-3.5 py-2 text-sm text-emerald-950 placeholder:text-emerald-900/90 focus:border-emerald-800 focus:outline-none focus:ring-1 focus:ring-emerald-800"
          />
          <button
            type="submit"
            disabled={!query.trim() || busy}
            className="text-xs font-semibold px-4 py-2"
          >
            {busy ? 'Connecting…' : 'Ask Copilot'}
          </button>
        </div>
      </form>

      {copilotError && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-950"
        >
          <span className="font-bold">Copilot Service Notice: </span>
          <span>{copilotError}</span>
          <p className="mt-1 text-amber-900/80">
            Photo analysis and sample reports remain available above. The conversational assistant is not connected.
          </p>
        </div>
      )}

      {response && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50/80 p-4 text-xs text-blue-950">
          <span className="font-bold">Copilot Response: </span>
          <p className="mt-1 text-sm">{response.message}</p>
        </div>
      )}

      {/* General Static Preparedness Checklist */}
      <div className="rounded-lg border border-emerald-900/10 bg-emerald-50/20 p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-950 m-0">
            General Storm Preparedness Checklist
          </h3>
          <span className="text-[10px] uppercase font-semibold text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded">
            Static General Guidance
          </span>
        </div>
        <p className="text-xs text-emerald-900/90 mb-3">
          General planning reminders. Confirm preparation details with <a className="underline" href="https://www.floridadisaster.org/planprepare/" target="_blank" rel="noopener noreferrer">Florida emergency management</a>.
        </p>

        <ul className="space-y-2.5 pl-0 list-none">
          {GENERAL_CHECKLIST.map((item) => {
            const isDone = !!checkedItems[item.id];
            return (
              <li key={item.id} className="flex items-start gap-2.5">
                <input
                  id={`check-${item.id}`}
                  type="checkbox"
                  checked={isDone}
                  onChange={() => toggleCheck(item.id)}
                  className="mt-0.5 h-4 w-4 rounded border-emerald-900/30 text-emerald-800 focus:ring-emerald-700 cursor-pointer"
                />
                <label
                  htmlFor={`check-${item.id}`}
                  className={`text-xs cursor-pointer select-none leading-snug ${
                    isDone ? 'line-through text-emerald-900/90' : 'text-emerald-950'
                  }`}
                >
                  {item.label}
                </label>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
