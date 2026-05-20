import React, { useState, useRef, useEffect, useMemo } from 'react';
import { SquareCheck, Plus, Play, Pause, Settings, Square, Copy, Hourglass, Clock, Download, Moon, Sun, Upload, CalendarClock, PictureInPicture, Goal, BriefcaseBusiness } from 'lucide-react';
import ConfirmDeleteButton from '../ui/ConfirmDeleteButton';
import { CSSTransition } from 'react-transition-group';

interface HeaderProps {
  timers: any[];
  isSimpleMode: boolean;
  isCheckingMode: boolean;
  isDarkMode: boolean;
  showDecimalTime: boolean;
  showMilliseconds: boolean;
  showByDate: boolean; // New property
  showWidget: boolean;
  showGoals: boolean;
  showAffairsAndMissions: boolean;
  currentStickyDate?: string | null;
  onDeleteAll: () => void;
  onToggleAll: () => void;
  onAddTimer: () => void;
  onToggleSimpleMode: () => void;
  onToggleCheckingMode: () => void;
  onToggleDecimalTime: () => void;
  onToggleMilliseconds: () => void;
  onToggleDarkMode: () => void;
  onDownloadJSON: () => void;
  getTotalTime: () => string;
  onImportJSON: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleByDate: () => void; // New method
  onToggleWidget: () => void; // New method
  onToggleGoals: () => void;
  onToggleAffairsAndMissions: () => void;
}

function SettingsDropdown({
  timers,
  isOpen,
  onClose,
  isSimpleMode,
  isCheckingMode,
  isDarkMode,
  showDecimalTime,
  showMilliseconds,
  showByDate, // New property
  showWidget,
  showGoals,
  showAffairsAndMissions,
  onToggleSimpleMode,
  onToggleCheckingMode,
  onToggleDecimalTime,
  onToggleMilliseconds,
  onToggleDarkMode,
  onDownloadJSON,
  onImportJSON,
  onToggleByDate, // New method
  onToggleWidget, // New method
  onToggleGoals,
  onToggleAffairsAndMissions,
}: {
  timers: any[];
  isOpen: boolean;
  onClose: () => void;
  isSimpleMode: boolean;
  isCheckingMode: boolean;
  isDarkMode: boolean;
  showDecimalTime: boolean;
  showMilliseconds: boolean;
  showByDate: boolean; // New property
  showWidget: boolean;
  showGoals: boolean;
  showAffairsAndMissions: boolean;
  onToggleSimpleMode: () => void;
  onToggleCheckingMode: () => void;
  onToggleDecimalTime: () => void;
  onToggleMilliseconds: () => void;
  onToggleDarkMode: () => void;
  onDownloadJSON: () => void;
  onImportJSON: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleByDate: () => void; // New method
  onToggleWidget: () => void; // New method
  onToggleGoals: () => void;
  onToggleAffairsAndMissions: () => void;
}) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  return (
    <CSSTransition
      in={isOpen}
      timeout={200}
      classNames="dropdown"
      unmountOnExit
      nodeRef={dropdownRef}
    >
      <div ref={dropdownRef} className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2">
        <button
          onClick={() => onToggleDecimalTime()}
          className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
        >
          <Hourglass className="w-4 h-4" />
          {showDecimalTime ? 'Hide' : 'Show'} decimal time
        </button>
        <button
          onClick={() => onToggleByDate()} // New button
          className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
        >
          <CalendarClock className="w-4 h-4" />
          {showByDate ? 'Ungroup' : 'Group'} by date
        </button>
        <button
          onClick={() => onToggleWidget()} // New button
          className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
        >
          <PictureInPicture className="w-4 h-4" />
          {showWidget ? 'Hide widget' : 'Show widget'}
        </button>
        <button
          onClick={() => onToggleGoals()}
          className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
        >
          <Goal className="w-4 h-4" />
          {showGoals ? 'Disable' : 'Enable'} time goals
        </button>
        {/* } */}
        <button
          onClick={() => onToggleAffairsAndMissions()}
          className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
        >
          <BriefcaseBusiness className="w-4 h-4" />
          {showAffairsAndMissions ? 'Disable' : 'Enable'} Affairs and Missions
        </button>
        <button
          onClick={() => onToggleSimpleMode()}
          className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
        >
          {!isSimpleMode ? <Square className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {isSimpleMode ? 'Enable' : 'Disable'} multi mode
        </button>
        <button
          onClick={() => onToggleCheckingMode()}
          className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
        >
          {isCheckingMode ? <SquareCheck className="w-4 h-4" /> : <Square className="w-4 h-4" />}
          {isCheckingMode ? 'Disable' : 'Enable'} checking
        </button>
        <button
          onClick={() => onToggleMilliseconds()}
          className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
        >
          <Clock className="w-4 h-4" />
          {showMilliseconds ? 'Hide' : 'Show'} milliseconds
        </button>
        {timers.length > 0 &&
          <button
            onClick={() => { onDownloadJSON(); onClose() }}
            className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export as JSON
          </button>
        }
        <label className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 cursor-pointer">
          <Upload className="w-4 h-4" />
          Import JSON
          <input type="file" accept=".json" onChange={(args) => { onImportJSON(args); onClose() }} className="hidden" />
        </label>
        <button
          onClick={() => { onToggleDarkMode(); onClose() }}
          className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
        >
          {!isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          Switch to {isDarkMode ? 'light' : 'dark'} mode
        </button>
        <div className="w-full px-4 py-2
        ">
          <a href="https://www.buymeacoffee.com/ablondel"><img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=ablondel&button_colour=5F7FFF&font_colour=ffffff&font_family=Poppins&outline_colour=000000&coffee_colour=FFDD00" /></a>
        </div>
      </div>
    </CSSTransition>
  );
}

export default function Header({
  timers,
  isSimpleMode,
  isCheckingMode,
  isDarkMode,
  showDecimalTime,
  showMilliseconds,
  showByDate, // New property
  showWidget,
  showGoals,
  showAffairsAndMissions,
  onDeleteAll,
  onToggleAll,
  onAddTimer,
  onToggleSimpleMode,
  onToggleCheckingMode,
  onToggleDecimalTime,
  onToggleMilliseconds,
  onToggleDarkMode,
  onDownloadJSON,
  getTotalTime,
  onImportJSON,
  onToggleByDate, // New method
  onToggleWidget, // New method
  onToggleGoals,
  onToggleAffairsAndMissions,
  currentStickyDate,
}: HeaderProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const mobileSettingsRef = useRef<HTMLDivElement>(null);
  const desktopSettingsRef = useRef<HTMLDivElement>(null);
  const [displayedDate, setDisplayedDate] = useState<string | null>(null);
  const [animating, setAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'up' | 'down'>('up');

  const formattedStickyDate = useMemo(() => {
    if (!currentStickyDate) return null;
    const [year, month, day] = currentStickyDate.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }, [currentStickyDate]);

  useEffect(() => {
    if (formattedStickyDate === displayedDate) return;
    if (formattedStickyDate === null) {
      // Animate out
      setSlideDirection('up');
      setAnimating(true);
      const timer = setTimeout(() => {
        setDisplayedDate(null);
        setAnimating(false);
      }, 250);
      return () => clearTimeout(timer);
    }
    if (displayedDate === null) {
      // Animate in
      setDisplayedDate(formattedStickyDate);
      setSlideDirection('down');
      setAnimating(true);
      const timer = setTimeout(() => setAnimating(false), 50);
      return () => clearTimeout(timer);
    }
    // Date changed: slide old out, then slide new in
    setSlideDirection('up');
    setAnimating(true);
    const timer = setTimeout(() => {
      setDisplayedDate(formattedStickyDate);
      setSlideDirection('down');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimating(false);
        });
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [formattedStickyDate]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        (mobileSettingsRef.current && !mobileSettingsRef.current.contains(event.target as Node)) &&
        (desktopSettingsRef.current && !desktopSettingsRef.current.contains(event.target as Node))
      ) {
        setIsSettingsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div data-sticky-header className="sticky top-0 z-50 backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-800 px-4 sm:px-8 py-4">
      <div className="max-w-12xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between">
          <div className="w-full sm:w-auto flex items-center justify-between gap-3">
            <div className="flex items-center justify-center">
              {timers.length > 0 &&
                <h1 className="text-3xl sm:text-4xl text-gray-800 dark:text-white">{getTotalTime()}</h1>
              }
            </div>
            <div className="sm:hidden flex items-center gap-2">
              {showByDate && displayedDate && (
                <div className="overflow-hidden h-7 flex items-center">
                  <span
                    className={`sticky-date-label inline-block text-sm font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap ${
                      animating
                        ? slideDirection === 'up'
                          ? 'sticky-date-out'
                          : 'sticky-date-enter'
                        : 'sticky-date-visible'
                    }`}
                  >
                    {displayedDate}
                  </span>
                </div>
              )}
              <div className="relative" ref={mobileSettingsRef}>
                <button
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${isSettingsOpen
                    ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
              >
                <Settings className="w-6 h-6" />
              </button>
              <SettingsDropdown
                timers={timers}
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                isSimpleMode={isSimpleMode}
                isCheckingMode={isCheckingMode}
                isDarkMode={isDarkMode}
                showDecimalTime={showDecimalTime}
                showMilliseconds={showMilliseconds}
                showByDate={showByDate} // New property
                showWidget={showWidget}
                showGoals={showGoals}
                showAffairsAndMissions={showAffairsAndMissions}
                onToggleSimpleMode={onToggleSimpleMode}
                onToggleCheckingMode={onToggleCheckingMode}
                onToggleDecimalTime={onToggleDecimalTime}
                onToggleMilliseconds={onToggleMilliseconds}
                onToggleDarkMode={onToggleDarkMode}
                onDownloadJSON={onDownloadJSON}
                onImportJSON={onImportJSON}
                onToggleByDate={onToggleByDate} // New method
                onToggleWidget={onToggleWidget}
                onToggleGoals={onToggleGoals}
                onToggleAffairsAndMissions={onToggleAffairsAndMissions}
              />
              </div>
            </div>
          </div>
          <div className="w-full sm:w-auto justify-end items-center gap-4 hidden sm:flex">
            {showByDate && displayedDate && (
              <div className="overflow-hidden h-7 flex items-center">
                <span
                  className={`sticky-date-label inline-block text-sm font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap ${
                    animating
                      ? slideDirection === 'up'
                        ? 'sticky-date-out'
                        : 'sticky-date-enter'
                      : 'sticky-date-visible'
                  }`}
                >
                  {displayedDate}
                </span>
              </div>
            )}
            {timers.length > 0 && (
              <ConfirmDeleteButton onDelete={onDeleteAll} />
            )}
            {timers.length > 0 && !isSimpleMode && (
              <button
                onClick={onToggleAll}
                className={`flex items-center gap-2 ${timers.find(elem => elem.isRunning)
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
            <div className="hidden sm:block relative" ref={desktopSettingsRef}>
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${isSettingsOpen
                  ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
              >
                <Settings className="w-6 h-6" />
              </button>
              <SettingsDropdown
                timers={timers}
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                isSimpleMode={isSimpleMode}
                isCheckingMode={isCheckingMode}
                isDarkMode={isDarkMode}
                showDecimalTime={showDecimalTime}
                showMilliseconds={showMilliseconds}
                showByDate={showByDate} // New property
                showWidget={showWidget}
                showGoals={showGoals}
                showAffairsAndMissions={showAffairsAndMissions}
                onToggleSimpleMode={onToggleSimpleMode}
                onToggleCheckingMode={onToggleCheckingMode}
                onToggleDecimalTime={onToggleDecimalTime}
                onToggleMilliseconds={onToggleMilliseconds}
                onToggleDarkMode={onToggleDarkMode}
                onDownloadJSON={onDownloadJSON}
                onImportJSON={onImportJSON}
                onToggleByDate={onToggleByDate} // New method
                onToggleWidget={onToggleWidget}
                onToggleGoals={onToggleGoals}
                onToggleAffairsAndMissions={onToggleAffairsAndMissions}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
