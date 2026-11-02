import { useState, useRef, useEffect } from 'react';

import { MAX_IMAGE_BYTES, IMAGE_TYPES as ALLOWED_TYPES } from '../contracts/assessment.js';

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
}

export default function DamageAuditor({
  samples,
  busy,
  error,
  file,
  preview,
  onFileSelect,
  onFileClear,
  onAnalyzeUploaded,
  onAnalyzeSample,
  activeSampleId,
}) {
  const [dragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (error) setValidationError('');
  }, [error]);

  function validateAndSelect(selectedFile) {
    if (!selectedFile) return;
    // A rejected replacement must not leave findings for the previous evidence.
    onFileClear();
    setValidationError('');
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setValidationError('Unsupported format. Please select a JPEG, PNG, or WebP photo.');
      return;
    }

    if (selectedFile.size > MAX_IMAGE_BYTES) {
      setValidationError(
        `File is too large (${formatBytes(selectedFile.size)}). Maximum supported size is 5 MiB.`
      );
      return;
    }

    if (selectedFile.size === 0) {
      setValidationError('The selected file is empty. Please choose a valid image.');
      return;
    }

    onFileSelect(selectedFile);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    if (busy) return;
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      validateAndSelect(droppedFile);
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
    if (!busy) setDragOver(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setDragOver(false);
  }

  return (
    <section
      className="panel no-print mb-8"
      aria-labelledby="auditor-heading"
      aria-busy={busy}
    >
      <div className="mb-4">
        <h2 id="auditor-heading" className="text-xl font-bold text-emerald-950 sm:text-2xl">
          1. Start with Property Damage Evidence
        </h2>
        <p className="text-sm text-emerald-900/80">
          Upload a clear photo of storm damage for live analysis, or explore an illustrative sample case.
        </p>
      </div>

      {/* Upload Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors duration-150 ${
          dragOver
            ? 'border-emerald-600 bg-emerald-50/80'
            : 'border-emerald-900/20 bg-emerald-50/30 hover:border-emerald-700/40 hover:bg-emerald-50/50'
        } ${busy ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          id="damage-image"
          aria-label="Upload a property damage photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          className="sr-only"
          onChange={(e) => {
            const selected = e.target.files?.[0];
            if (selected) validateAndSelect(selected);
          }}
        />

        {preview ? (
          <div className="flex w-full flex-col items-center gap-3">
            <div className="relative overflow-hidden rounded-lg border border-emerald-900/20 bg-white p-1 shadow-sm">
              <img
                src={preview}
                alt="Selected property damage preview"
                className="preview max-h-72 w-auto object-contain rounded"
              />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-semibold text-emerald-950">
                {file?.name}
              </span>
              <span className="text-xs text-emerald-900/90">
                {file ? formatBytes(file.size) : ''} · {file?.type}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
                className="secondary text-xs px-3 py-1.5 font-medium"
              >
                Change photo
              </button>
              <button
                type="button"
                onClick={() => { setValidationError(''); onFileClear(); }}
                disabled={busy}
                className="secondary text-xs px-3 py-1.5 font-medium text-rose-800 hover:text-rose-950"
              >
                Remove photo
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-4">
            <div className="rounded-full bg-emerald-100 p-3 text-emerald-800">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                />
              </svg>
            </div>
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
                className="secondary font-semibold text-emerald-900 underline hover:text-emerald-950"
              >
                Choose a photo
              </button>
              <span className="text-sm text-emerald-900/90"> or drag and drop here</span>
            </div>
            <p className="text-xs text-emerald-900/90">
              JPEG, PNG, or WebP · Up to 5 MiB
            </p>
          </div>
        )}
      </div>

      {/* Validation or Error Message */}
      {validationError && (
        <div
          role="alert"
          className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900"
        >
          <span className="font-semibold">Notice:</span> {validationError}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3.5 text-sm text-amber-950"
        >
          <p className="font-semibold">Service Notice</p>
          <p className="mt-0.5 text-amber-900">{error}</p>
          <p className="mt-2 text-xs text-amber-800">
            You can test the full reporting flow anytime using the pre-written sample cases below.
          </p>
        </div>
      )}

      {/* Analyze Action for Upload */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <button
          type="button"
          disabled={!file || busy}
          onClick={onAnalyzeUploaded}
          className="inline-flex items-center justify-center gap-2 font-semibold shadow-sm text-sm px-5 py-2.5 rounded-lg"
        >
          {busy && file ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              <span>Analyzing photo…</span>
            </>
          ) : (
            <span>Analyze uploaded photo</span>
          )}
        </button>

        <p role="status" aria-live="polite" className="text-xs text-emerald-900/90">
          {busy ? 'Processing request…' : file ? 'Photo ready for analysis' : 'No photo selected'}
        </p>
      </div>

      {/* Sample Cases Divider */}
      <div className="my-6 border-t border-emerald-900/10 pt-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-900 m-0">
              Or Explore Labeled Illustrative Samples
            </h3>
            <p className="text-xs text-emerald-900/90 mt-0.5">
              Pre-written samples available without an API key while the app is running.
            </p>
          </div>
          <span className="hidden sm:inline-block rounded bg-emerald-100/70 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
            Offline Fixtures
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {samples.map((sample) => {
            const isSelected = activeSampleId === sample.id;
            return (
              <button
                key={sample.id}
                type="button"
                disabled={busy}
                onClick={() => { setValidationError(''); onAnalyzeSample(sample.id); }}
                className={`flex flex-col items-start rounded-lg border p-3 text-left transition-shadow ${
                  isSelected
                    ? 'border-emerald-800 bg-emerald-900 text-white shadow-sm ring-2 ring-emerald-800 ring-offset-1'
                    : 'border-emerald-900/15 bg-white text-emerald-950 hover:border-emerald-800/40 hover:bg-emerald-50/50'
                }`}
              >
                {sample.imageUrl && (
                  <img src={sample.imageUrl} alt={`Synthetic illustration of ${sample.title}; not a real photo`} className="mb-2 w-full rounded" />
                )}
                <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-emerald-950'}`}>
                  {sample.title}
                </span>
                <span className={`mt-1 text-[11px] line-clamp-2 ${isSelected ? 'text-emerald-100' : 'text-emerald-900/90'}`}>
                  {sample.description}
                </span>
                <span className={`mt-2 inline-block text-[10px] font-semibold uppercase tracking-wider ${isSelected ? 'text-emerald-200' : 'text-emerald-800'}`}>
                  {isSelected ? '✓ Active sample' : 'Load sample →'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
