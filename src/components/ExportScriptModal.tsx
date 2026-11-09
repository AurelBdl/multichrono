import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Copy, X } from 'lucide-react';
import type { Timer } from './SortableTimer';
import { buildReportingScript } from '../utils/exportReportingScript';

export default function ExportScriptModal({ timers, onClose }: { timers: Timer[]; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [error, setError] = useState('');
  const [script, setScript] = useState('');
  const [copied, setCopied] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  const resetResult = () => {
    setError('');
    setScript('');
    setCopied(false);
  };

  const copyScript = async () => {
    resetResult();
    let generated: string;
    try {
      generated = buildReportingScript(timers, dateFrom, dateTo);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to generate the script.');
      return;
    }
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(generated);
      setCopied(true);
    } catch {
      setScript(generated);
      setError('The automatic copy is unavailable. Copy the script below.');
    } finally {
      setIsCopying(false);
    }
  };

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby="export-script-title"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-md overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 text-gray-800 shadow-2xl backdrop:bg-black/30 backdrop:backdrop-blur-[2px] dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:p-6"
    >
      <form onSubmit={(event) => { event.preventDefault(); void copyScript(); }}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id="export-script-title" className="flex items-center gap-2 text-base font-semibold">
            <Copy className="h-4 w-4 text-indigo-500" />
            Copy script
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
          Export timers within the selected date range, including both dates. Then paste the script into your software’s console while logged in.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block min-w-0">
            <span className="mb-1.5 block text-xs text-gray-500 dark:text-gray-400">Start date</span>
            <input
              type="date"
              required
              autoFocus
              value={dateFrom}
              max={dateTo || '9999-12-31'}
              disabled={isCopying}
              onChange={(event) => { setDateFrom(event.target.value); resetResult(); }}
              className="block w-full min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700/60"
            />
          </label>
          <label className="block min-w-0">
            <span className="mb-1.5 block text-xs text-gray-500 dark:text-gray-400">End date</span>
            <input
              type="date"
              required
              value={dateTo}
              min={dateFrom}
              max="9999-12-31"
              disabled={isCopying}
              onChange={(event) => { setDateTo(event.target.value); resetResult(); }}
              className="block w-full min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700/60"
            />
          </label>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
          All timers within the date range are included, even if unchecked or hidden by filters. Each timer must have a mission. Payroll event ID 1 is always used.
        </p>
        {error && <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
        {script && (
          <textarea
            aria-label="Script to copy manually"
            readOnly
            value={script}
            onFocus={(event) => event.currentTarget.select()}
            rows={7}
            className="mt-3 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 font-mono text-xs dark:border-gray-600 dark:bg-gray-900"
          />
        )}
        {copied && <p role="status" className="mt-4 text-sm text-green-700 dark:text-green-400">Script copied. Paste it in your software's console.</p>}
        <button
          type="submit"
          disabled={!dateFrom || !dateTo || dateFrom > dateTo || isCopying}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          <Copy className="h-4 w-4" />
          {isCopying ? 'Copying…' : copied ? 'Copy again' : 'Copy script'}
        </button>
      </form>
    </dialog>,
    document.body
  );
}
