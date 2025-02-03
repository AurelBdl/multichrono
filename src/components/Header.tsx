import React, { useState, useRef, useEffect } from 'react';
import { Timer, Plus, Play, Pause, Settings, Square, Copy, Hourglass, Clock, Download } from 'lucide-react';
import ConfirmDeleteButton from '../ui/ConfirmDeleteButton';

interface HeaderProps {
  timers: any[];
  isSimpleMode: boolean;
  showDecimalTime: boolean;
  showMilliseconds: boolean;
  onDeleteAll: () => void;
  onToggleAll: () => void;
  onAddTimer: () => void;
  onToggleSimpleMode: () => void;
  onToggleDecimalTime: () => void;
  onToggleMilliseconds: () => void;
  onDownloadJSON: () => void;
  getTotalTime: () => string;
}

function SettingsDropdown({
  isOpen,
  onClose,
  isSimpleMode,
  showDecimalTime,
  showMilliseconds,
  onToggleSimpleMode,
  onToggleDecimalTime,
  onToggleMilliseconds,
  onDownloadJSON,
}: {
  isOpen: boolean;
  onClose: () => void;
  isSimpleMode: boolean;
  showDecimalTime: boolean;
  showMilliseconds: boolean;
  onToggleSimpleMode: () => void;
  onToggleDecimalTime: () => void;
  onToggleMilliseconds: () => void;
  onDownloadJSON: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2">
      <button
        onClick={() => { onDownloadJSON(); onClose(); }}
        className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        Download as JSON
      </button>
      <button
        onClick={() => { onToggleMilliseconds(); onClose(); }}
        className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
      >
        <Clock className="w-4 h-4" />
        {showMilliseconds ? 'Hide' : 'Show'} milliseconds
      </button>
      <button
        onClick={() => { onToggleDecimalTime(); onClose(); }}
        className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
      >
        <Hourglass className="w-4 h-4" />
        {showDecimalTime ? 'Hide' : 'Show'} decimal time
      </button>
      <button
        onClick={() => { onToggleSimpleMode(); onClose(); }}
        className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
      >
        {!isSimpleMode ? <Square className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        {isSimpleMode ? 'Enable' : 'Disable'} multi mode
      </button>
    </div>
  );
}

export default function Header({
  timers,
  isSimpleMode,
  showDecimalTime,
  showMilliseconds,
  onDeleteAll,
  onToggleAll,
  onAddTimer,
  onToggleSimpleMode,
  onToggleDecimalTime,
  onToggleMilliseconds,
  onDownloadJSON,
  getTotalTime
}: HeaderProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="sticky top-0 z-50 backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-800 mb-8 px-4 sm:px-8 py-4">
      <div className="max-w-12xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between">
          <div className="w-full sm:w-auto flex items-center justify-between gap-3 mb-4 sm:mb-0">
            <div className="flex items-center gap-3">
              <Timer className="w-8 h-8 text-indigo-600 dark:text-indigo-500" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Multi Timer</h1>
              {timers.length > 1 && 
                <h1 className="text-2xl sm:text-3xl text-gray-800 dark:text-white">{getTotalTime()}</h1>
              }
            </div>
            <div className="sm:hidden relative" ref={settingsRef}>
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                  isSettingsOpen
                    ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Settings className="w-6 h-6" />
              </button>
              <SettingsDropdown
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                isSimpleMode={isSimpleMode}
                showDecimalTime={showDecimalTime}
                showMilliseconds={showMilliseconds}
                onToggleSimpleMode={onToggleSimpleMode}
                onToggleDecimalTime={onToggleDecimalTime}
                onToggleMilliseconds={onToggleMilliseconds}
                onDownloadJSON={onDownloadJSON}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            {timers.length > 0 && (
              <ConfirmDeleteButton onDelete={onDeleteAll} />
            )}
            {timers.length > 0 && !isSimpleMode && (
              <button
                onClick={onToggleAll}
                className={`flex items-center gap-2 ${
                  timers.find(elem => elem.isRunning)
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                } text-white p-2 rounded-lg transition-colors`}
              >
                {timers.find(elem => elem.isRunning) ? (
                  <>
                    <Pause className="w-6 h-6" />
                    <span className="hidden sm:inline">Pause All</span>
                  </>
                ) : (
                  <>
                    <Play className="w-6 h-6" />
                    <span className="hidden sm:inline">Start All</span>
                  </>
                )}
              </button>
            )}
            <button
              onClick={onAddTimer}
              className="flex items-center gap-2 bg-indigo-600 dark:bg-indigo-500 text-white p-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
            >
              <Plus className="w-6 h-6" />
              <span className="hidden sm:inline">Add Timer</span>
            </button>
            <div className="hidden sm:block relative" ref={settingsRef}>
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                  isSettingsOpen
                    ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Settings className="w-6 h-6" />
              </button>
              <SettingsDropdown
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                isSimpleMode={isSimpleMode}
                showDecimalTime={showDecimalTime}
                showMilliseconds={showMilliseconds}
                onToggleSimpleMode={onToggleSimpleMode}
                onToggleDecimalTime={onToggleDecimalTime}
                onToggleMilliseconds={onToggleMilliseconds}
                onDownloadJSON={onDownloadJSON}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}