import { useEffect, useState } from 'react';

// Stable integration entry point: Antigravity may decompose this into components.
export default function StormGuardApp({ services }) {
  const [samples, setSamples] = useState([]);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { services.listSampleCases().then(setSamples).catch(() => setError('Samples could not be loaded.')); }, [services]);
  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  async function analyze(input) {
    setBusy(true); setError(''); setAssessment(null);
    try { setAssessment(await services.analyzeDamage(input)); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }
  return <main className="mx-auto max-w-4xl px-6 py-12">
    <header className="mb-10"><p className="eyebrow">Southwest Florida · Property documentation</p><h1 className="text-4xl font-bold">StormGuard AI</h1><p>Document what you can see. Prepare a report for review.</p></header>
    <section className="panel no-print" aria-labelledby="upload-heading">
      <h2 id="upload-heading">Start with a photo</h2>
      <p>Live analysis is awaiting backend integration. Samples are pre-written illustrations.</p>
      <label htmlFor="damage-image">Damage photo · JPEG, PNG, or WebP · up to 5 MiB</label>
      <input id="damage-image" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(event) => { setFile(event.target.files?.[0] || null); setAssessment(null); setError(''); }} />
      {preview && <img className="preview" src={preview} alt="Selected property damage photo" />}
      <button disabled={!file || busy} onClick={() => analyze({ file })}>Analyze uploaded photo</button>
      <h3>Explore a labeled sample</h3>
      <div className="flex flex-wrap gap-3">{samples.map((sample) => <button key={sample.id} disabled={busy} onClick={() => { setFile(null); analyze({ sampleId: sample.id }); }}>{sample.title}</button>)}</div>
      <p role="status" aria-live="polite">{busy ? 'Analyzing…' : ''}</p>
      {error && <p role="alert">{error}</p>}
    </section>
    {assessment && <article className="panel report" aria-labelledby="report-heading">
      <p className="eyebrow">{assessment.mode === 'sample' ? 'SAMPLE · Pre-written illustration' : 'AI-generated · Requires review'}</p>
      <h2 id="report-heading">Property documentation draft</h2>
      <p>{assessment.summary}</p><p>Preliminary severity: {assessment.severity}</p>
      {['observations', 'hazards', 'nextSteps', 'limitations'].map((key) => <section key={key}><h3>{({ observations: 'Visible observations', hazards: 'Potential concerns', nextSteps: 'Next steps', limitations: 'Limitations' })[key]}</h3><ul>{assessment[key].map((item, index) => <li key={index}>{item}</li>)}</ul></section>)}
      <p>Generated: {new Date(assessment.createdAt).toLocaleString()}</p>
      <button className="no-print" onClick={() => window.print()}>Print report / Save as PDF</button>
    </article>}
    <footer className="mt-8 no-print"><p>Live evacuation zones, shelter availability, and advisories are not connected. No official evacuation zone is inferred from a city name.</p></footer>
  </main>;
}
