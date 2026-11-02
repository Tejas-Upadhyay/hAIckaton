import { useEffect, useState, useRef } from 'react';
import Header from './Header.jsx';
import DamageAuditor from './DamageAuditor.jsx';
import DocumentationReport from './DocumentationReport.jsx';
import EmergencyResources from './EmergencyResources.jsx';
import StormCopilot from './StormCopilot.jsx';

export default function StormGuardApp({ services }) {
  const [samples, setSamples] = useState([]);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [activeSampleId, setActiveSampleId] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Request counter to safely ignore out-of-order/stale asynchronous responses
  const activeRequestIdRef = useRef(0);

  useEffect(() => {
    let active = true;
    services.listSampleCases()
      .then((items) => {
        if (active) setSamples(items);
      })
      .catch(() => {
        if (active) setError('Sample cases could not be loaded.');
      });
    return () => {
      active = false;
    };
  }, [services]);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function executeAnalysis(input, sampleId = null) {
    const requestId = ++activeRequestIdRef.current;
    setBusy(true);
    setError('');
    setAssessment(null);
    if (sampleId) {
      setActiveSampleId(sampleId);
    } else {
      setActiveSampleId(null);
    }

    try {
      const result = await services.analyzeDamage(input);
      // Only commit result if this request is still the most recent one
      if (requestId === activeRequestIdRef.current) {
        setAssessment(result);
      }
    } catch (err) {
      if (requestId === activeRequestIdRef.current) {
        setError(err.message || 'Analysis could not be completed.');
      }
    } finally {
      if (requestId === activeRequestIdRef.current) {
        setBusy(false);
      }
    }
  }

  function handleFileSelect(newFile) {
    ++activeRequestIdRef.current;
    setBusy(false);
    setFile(newFile);
    setAssessment(null);
    setActiveSampleId(null);
    setError('');
  }

  function handleFileClear() {
    ++activeRequestIdRef.current;
    setBusy(false);
    setFile(null);
    setPreview(null);
    setAssessment(null);
    setActiveSampleId(null);
    setError('');
  }

  function handleAnalyzeUploaded() {
    if (!file || busy) return;
    executeAnalysis({ file }, null);
  }

  function handleAnalyzeSample(sampleId) {
    if (busy) return;
    // Selecting a sample clears any uploaded file/preview so evidence is not conflated
    setFile(null);
    setPreview(null);
    executeAnalysis({ sampleId }, sampleId);
  }

  function handleClearReport() {
    setAssessment(null);
    setActiveSampleId(null);
    setError('');
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <Header />

      <DamageAuditor
        samples={samples}
        busy={busy}
        error={error}
        file={file}
        preview={preview}
        onFileSelect={handleFileSelect}
        onFileClear={handleFileClear}
        onAnalyzeUploaded={handleAnalyzeUploaded}
        onAnalyzeSample={handleAnalyzeSample}
        activeSampleId={activeSampleId}
      />

      <DocumentationReport
        assessment={assessment}
        onClear={handleClearReport}
      />

      <EmergencyResources services={services} />

      <StormCopilot services={services} />

      <footer className="mt-12 border-t border-emerald-900/10 pt-6 text-center text-xs text-emerald-900/90 no-print">
        <p>
          StormGuard AI is a preliminary property-documentation tool developed for the H&#123;AI&#125;ckathon.
        </p>
        <p className="mt-1">
          Provisional observations only. Not an official FEMA damage classification, insurance coverage determination, or repair quote. Always confirm safety with local officials.
        </p>
      </footer>
    </main>
  );
}
