import React, { useState, useRef, useEffect, useMemo } from 'react';
import { SquareCheck, Plus, Play, Pause, Settings, Square, Copy, Hourglass, Clock, Download, Moon, Sun, Upload, CalendarClock, PictureInPicture, Goal, BriefcaseBusiness, Search, X, SlidersHorizontal, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import ConfirmDeleteButton from '../ui/ConfirmDeleteButton';
import { CSSTransition } from 'react-transition-group';

type TimerMissingMetadataFilter = 'all' | 'missing-affair-or-mission' | 'checked' | 'not-checked';

type TimerFilters = {
  searchTerm: string;
  dateFrom: string;
  dateTo: string;
  missingMetadata: TimerMissingMetadataFilter;
};

interface HeaderProps {
  timers: any[];
  filteredTimersCount: number;
  timerFilters: TimerFilters;
  isSimpleMode: boolean;
  isCheckingMode: boolean;
  isDarkMode: boolean;
  showDecimalTime: boolean;
  showMilliseconds: boolean;
  showByDate: boolean; // New property
  showFilterBar: boolean;
  supportsWidget: boolean;
  showWidget: boolean;
  showGoals: boolean;
  showAffairsAndMissions: boolean;
  currentStickyDate?: string | null;
  onDeleteAll: () => void;
  onToggleAll: () => void;
  onAddTimer: () => void;
  onAddTimerWithDate: () => void;
  onToggleSimpleMode: () => void;
  onToggleCheckingMode: () => void;
  onToggleDecimalTime: () => void;
  onToggleMilliseconds: () => void;
  onToggleDarkMode: () => void;
  onDownloadJSON: () => void;
  getTotalTime: () => string;
  onImportJSON: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleByDate: () => void; // New method
  onToggleFilterBar: () => void;
  onToggleWidget: () => void; // New method
  onToggleGoals: () => void;
  onToggleAffairsAndMissions: () => void;
  onTimerFiltersChange: React.Dispatch<React.SetStateAction<TimerFilters>>;
}

interface AddTimerButtonProps {
  onAddTimer: () => void;
  onAddTimerWithDate: () => void;
}

const ADD_TIMER_HOLD_DURATION_MS = 500;

function AddTimerButton({ onAddTimer, onAddTimerWithDate }: AddTimerButtonProps) {
  const frameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const isHoldingRef = useRef(false);
  const hasCompletedHoldRef = useRef(false);
  const progressBarRef = useRef<HTMLSpanElement>(null);

  const clearFrame = () => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  };

  const setProgress = (percent: number) => {
    if (!progressBarRef.current) {
      return;
    }

    progressBarRef.current.style.width = `${percent}%`;
    progressBarRef.current.style.opacity = percent > 0 ? '1' : '0';
  };

  const resetHold = () => {
    isHoldingRef.current = false;
    hasCompletedHoldRef.current = false;
    startTimeRef.current = null;
    clearFrame();
    setProgress(0);
  };

  const completeHold = () => {
    if (hasCompletedHoldRef.current) {
      return;
    }

    hasCompletedHoldRef.current = true;
    isHoldingRef.current = false;
    startTimeRef.current = null;
    clearFrame();
    setProgress(100);
    onAddTimerWithDate();

    window.setTimeout(() => {
      setProgress(0);
      hasCompletedHoldRef.current = false;
    }, 180);
  };

  const startHold = () => {
    if (isHoldingRef.current) {
      return;
    }

    clearFrame();
    isHoldingRef.current = true;
    hasCompletedHoldRef.current = false;
    startTimeRef.current = null;
    setProgress(0);

    const animate = (timestamp: number) => {
      if (!isHoldingRef.current) {
        return;
      }

      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const nextProgress = Math.min((elapsed / ADD_TIMER_HOLD_DURATION_MS) * 100, 100);
      setProgress(nextProgress);

      if (elapsed >= ADD_TIMER_HOLD_DURATION_MS) {
        completeHold();
        return;
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
  };

  const cancelHold = () => {
    if (!isHoldingRef.current || hasCompletedHoldRef.current) {
      return;
    }

    resetHold();
  };

  useEffect(() => () => clearFrame(), []);

  return (
    <button
      type="button"
      onPointerDown={(event) => {
        if (event.button !== 0) {
          return;
        }

        event.preventDefault();
        event.currentTarget.setPointerCapture?.(event.pointerId);
        startHold();
      }}
      onPointerUp={() => {
        if (isHoldingRef.current && !hasCompletedHoldRef.current) {
          cancelHold();
          onAddTimer();
        }
      }}
      onPointerCancel={cancelHold}
      onPointerLeave={(event) => {
        if ((event.buttons & 1) === 0) {
          cancelHold();
        }
      }}
      onClick={(event) => {
        if (event.detail === 0) {
          onAddTimer();
        }
      }}
      onContextMenu={(event) => event.preventDefault()}
      className="relative flex items-center gap-2 overflow-hidden rounded-lg bg-indigo-600 p-2 text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
      title="Click to add a timer. Hold to choose a date."
      aria-label="Add timer. Hold to choose a date."
    >
      <span
        ref={progressBarRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 rounded-[inherit] bg-indigo-400/70 transition-[width,opacity] duration-150 ease-out dark:bg-indigo-300/35"
        style={{ width: '0%', opacity: 0 }}
      />
      <span className="relative z-10 flex items-center justify-center gap-2">
        <Plus className="h-6 w-6" />
        <span className="hidden sm:inline">Add Timer</span>
      </span>
    </button>
  );
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
  showFilterBar,
  supportsWidget,
  showWidget,
  showGoals,
  showAffairsAndMissions,
  hideFilterBarToggle = false,
  onToggleSimpleMode,
  onToggleCheckingMode,
  onToggleDecimalTime,
  onToggleMilliseconds,
  onToggleDarkMode,
  onDownloadJSON,
  onImportJSON,
  onToggleByDate, // New method
  onToggleFilterBar,
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
  showFilterBar: boolean;
  supportsWidget: boolean;
  showWidget: boolean;
  showGoals: boolean;
  showAffairsAndMissions: boolean;
  hideFilterBarToggle?: boolean;
  onToggleSimpleMode: () => void;
  onToggleCheckingMode: () => void;
  onToggleDecimalTime: () => void;
  onToggleMilliseconds: () => void;
  onToggleDarkMode: () => void;
  onDownloadJSON: () => void;
  onImportJSON: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleByDate: () => void; // New method
  onToggleFilterBar: () => void;
  onToggleWidget: () => void; // New method
  onToggleGoals: () => void;
  onToggleAffairsAndMissions: () => void;
}) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const checkedTimersCount = timers.filter(timer => timer.isChecked).length;

  return (
    <CSSTransition
      in={isOpen}
      timeout={200}
      classNames="dropdown"
      unmountOnExit
      nodeRef={dropdownRef}
    >
      <div ref={dropdownRef} className="absolute right-0 z-50 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2">
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
        {!hideFilterBarToggle && (
          <button
            onClick={() => onToggleFilterBar()}
            className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {showFilterBar ? 'Hide' : 'Show'} filters
          </button>
        )}
        {supportsWidget && (
          <button
            onClick={() => onToggleWidget()} // New button
            className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <PictureInPicture className="w-4 h-4" />
            {showWidget ? 'Hide widget' : 'Show widget'}
          </button>
        )}
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
            {checkedTimersCount > 0
              ? `Export selected as JSON (${checkedTimersCount})`
              : 'Export as JSON'}
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

const missingMetadataFilterOptions: Array<{
  value: TimerMissingMetadataFilter;
  label: string;
  hint: string;
}> = [
  { value: 'all', label: 'All timers', hint: 'No missing field filter' },
  { value: 'missing-affair-or-mission', label: 'Missing affair or mission', hint: 'One field is empty' },
  { value: 'checked', label: 'Checked', hint: 'Only checked timers' },
  { value: 'not-checked', label: 'Not checked', hint: 'Only unchecked timers' },
];

function MissingMetadataFilterSelect({
  value,
  onChange,
}: {
  value: TimerMissingMetadataFilter;
  onChange: (value: TimerMissingMetadataFilter) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedOption = missingMetadataFilterOptions.find(option => option.value === value) ?? missingMetadataFilterOptions[0];

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown, true);
    return () => document.removeEventListener('mousedown', handlePointerDown, true);
  }, [isOpen]);

  return (
    <div className="relative w-full min-w-0" ref={rootRef}>
      <button
        type="button"
        onClick={() => setIsOpen(open => !open)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setIsOpen(false);
          }
        }}
        className={`group flex h-10 w-full items-center justify-between rounded-xl border px-3 text-left transition-all ${
          isOpen
            ? 'border-indigo-500 bg-white shadow-lg shadow-indigo-500/10 dark:border-indigo-400 dark:bg-gray-800'
            : 'border-gray-200 bg-white/80 hover:border-gray-300 hover:bg-white dark:border-gray-700 dark:bg-gray-800/80 dark:hover:bg-gray-800'
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-gray-800 dark:text-white">
            {selectedOption.label}
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-black/10 dark:border-gray-600 dark:bg-gray-800"
          role="listbox"
        >
          {missingMetadataFilterOptions.map(option => {
            const isSelected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center px-4 py-3 text-left transition-colors ${
                  isSelected
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700/60'
                }`}
                role="option"
                aria-selected={isSelected}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{option.label}</span>
                  <span className={`mt-0.5 block truncate text-xs ${
                    isSelected
                      ? 'text-indigo-500 dark:text-indigo-300/80'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    {option.hint}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const weekDayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const formatDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateValue = (value: string) => {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
};

const formatReadableDate = (value: string) => {
  const date = parseDateValue(value);
  if (!date) {
    return '';
  }

  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const getCalendarDays = (viewDate: Date) => {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const startDate = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return date;
  });
};

function FilterDateRangePicker({
  dateFrom,
  dateTo,
  onChange,
}: {
  dateFrom: string;
  dateTo: string;
  onChange: (range: { dateFrom: string; dateTo: string }) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedStartDate = parseDateValue(dateFrom);
  const selectedEndDate = parseDateValue(dateTo);
  const todayValue = formatDateValue(new Date());
  const [viewDate, setViewDate] = useState(() => selectedStartDate ?? selectedEndDate ?? new Date());
  const calendarDays = getCalendarDays(viewDate);
  const hasRange = dateFrom !== '' || dateTo !== '';
  const rangeLabel = dateFrom && dateTo
    ? `${formatReadableDate(dateFrom)} - ${formatReadableDate(dateTo)}`
    : dateFrom
      ? `${formatReadableDate(dateFrom)} - ...`
      : dateTo
        ? `... - ${formatReadableDate(dateTo)}`
        : 'Date range';

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setViewDate(selectedStartDate ?? selectedEndDate ?? new Date());

    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown, true);
    return () => document.removeEventListener('mousedown', handlePointerDown, true);
  }, [isOpen, selectedStartDate?.getTime(), selectedEndDate?.getTime()]);

  const moveMonth = (direction: -1 | 1) => {
    setViewDate(current => new Date(current.getFullYear(), current.getMonth() + direction, 1));
  };

  const selectDay = (dayValue: string) => {
    if (!dateFrom || dateTo) {
      onChange({ dateFrom: dayValue, dateTo: '' });
      return;
    }

    if (dayValue < dateFrom) {
      onChange({ dateFrom: dayValue, dateTo: dateFrom });
      setIsOpen(false);
      return;
    }

    onChange({ dateFrom, dateTo: dayValue });
    setIsOpen(false);
  };

  const clearRange = () => {
    onChange({ dateFrom: '', dateTo: '' });
  };

  return (
    <div className="relative min-w-0" ref={rootRef}>
      <button
        type="button"
        onClick={() => setIsOpen(open => !open)}
        className="absolute left-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-200"
        aria-label="Open date range picker"
        title="Open date range picker"
      >
        <CalendarClock className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setIsOpen(open => !open)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setIsOpen(false);
          }
        }}
        className={`date-filter-input h-10 w-full min-w-0 rounded-xl border border-gray-200 bg-white/80 pl-9 text-sm font-medium text-gray-800 outline-none transition-all hover:border-gray-300 hover:bg-white focus:border-indigo-500 focus:bg-white focus:shadow-lg focus:shadow-indigo-500/10 dark:border-gray-700 dark:bg-gray-800/80 dark:text-white dark:hover:bg-gray-800 dark:focus:border-indigo-400 dark:focus:bg-gray-800 ${
          hasRange ? 'pr-9' : 'pr-3'
        }`}
        aria-label="Filter by date range"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span className={`block truncate text-left ${hasRange ? '' : 'font-normal text-gray-400 dark:text-gray-500'}`}>
          {rangeLabel}
        </span>
      </button>
      {hasRange && (
        <button
          type="button"
          onClick={clearRange}
          className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          aria-label="Clear date range"
          title="Clear date range"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-30 w-80 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-black/10 dark:border-gray-600 dark:bg-gray-800">
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2.5 dark:border-gray-700">
            <button
              type="button"
              onClick={() => moveMonth(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-sm font-semibold capitalize text-gray-800 dark:text-white">
              {viewDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </div>
            <button
              type="button"
              onClick={() => moveMonth(1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="p-3">
            <div className="mb-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-900/40">
                <div className="text-[11px] font-semibold uppercase text-gray-400 dark:text-gray-500">From</div>
                <div className={`mt-0.5 truncate text-sm font-medium ${dateFrom ? 'text-gray-800 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                  {dateFrom ? formatReadableDate(dateFrom) : 'Not set'}
                </div>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-900/40">
                <div className="text-[11px] font-semibold uppercase text-gray-400 dark:text-gray-500">To</div>
                <div className={`mt-0.5 truncate text-sm font-medium ${dateTo ? 'text-gray-800 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                  {dateTo ? formatReadableDate(dateTo) : dateFrom ? 'Pick end' : 'Not set'}
                </div>
              </div>
            </div>
            <div className="mb-2 grid grid-cols-7 gap-1">
              {weekDayLabels.map(day => (
                <div key={day} className="flex h-7 items-center justify-center text-[11px] font-semibold uppercase text-gray-400 dark:text-gray-500">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map(date => {
                const dayValue = formatDateValue(date);
                const isStart = dayValue === dateFrom;
                const isEnd = dayValue === dateTo;
                const isSelected = isStart || isEnd;
                const isInRange = dateFrom && dateTo && dayValue > dateFrom && dayValue < dateTo;
                const isToday = dayValue === todayValue;
                const isOutsideMonth = date.getMonth() !== viewDate.getMonth();

                return (
                  <button
                    key={dayValue}
                    type="button"
                    onClick={() => selectDay(dayValue)}
                    className={`flex h-8 items-center justify-center rounded-lg text-sm transition-colors ${
                      isSelected
                        ? 'bg-indigo-500 font-semibold text-white shadow-lg shadow-indigo-500/20'
                        : isInRange
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-200'
                        : isToday
                          ? 'bg-indigo-50 font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
                          : isOutsideMonth
                            ? 'text-gray-300 hover:bg-gray-50 dark:text-gray-600 dark:hover:bg-gray-700/40'
                            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
                    }`}
                    aria-pressed={isSelected}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 px-3 py-2 dark:border-gray-700">
            <button
              type="button"
              onClick={() => {
                const today = formatDateValue(new Date());
                onChange({ dateFrom: today, dateTo: today });
                setIsOpen(false);
              }}
              className="rounded-lg px-2 py-1 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-500/15"
            >
              Today
            </button>
            {hasRange && (
              <button
                type="button"
                onClick={() => {
                  clearRange();
                  setIsOpen(false);
                }}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DesktopTimerFilters({
  timerFilters,
  timersCount,
  filteredTimersCount,
  onTimerFiltersChange,
}: {
  timerFilters: TimerFilters;
  timersCount: number;
  filteredTimersCount: number;
  onTimerFiltersChange: React.Dispatch<React.SetStateAction<TimerFilters>>;
}) {
  const hasActiveFilters =
    timerFilters.searchTerm.trim() !== '' ||
    timerFilters.dateFrom !== '' ||
    timerFilters.dateTo !== '' ||
    timerFilters.missingMetadata !== 'all';

  const updateFilter = <K extends keyof TimerFilters>(key: K, value: TimerFilters[K]) => {
    onTimerFiltersChange(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    onTimerFiltersChange({
      searchTerm: '',
      dateFrom: '',
      dateTo: '',
      missingMetadata: 'all',
    });
  };

  return (
    <div className="hidden sm:grid w-full grid-cols-[minmax(14rem,2fr)_minmax(18rem,1.6fr)_minmax(14rem,1.4fr)_auto_auto] items-center gap-2 pt-3">
      <div className="relative min-w-0">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
        <input
          type="search"
          value={timerFilters.searchTerm}
          onChange={(event) => updateFilter('searchTerm', event.target.value)}
          placeholder="Search by name"
          className="h-10 w-full rounded-xl border border-gray-200 bg-white/80 pl-9 pr-3 text-sm font-medium text-gray-800 outline-none transition-all placeholder:font-normal placeholder:text-gray-400 hover:border-gray-300 hover:bg-white focus:border-indigo-500 focus:bg-white focus:shadow-lg focus:shadow-indigo-500/10 dark:border-gray-700 dark:bg-gray-800/80 dark:text-white dark:placeholder:text-gray-500 dark:hover:bg-gray-800 dark:focus:border-indigo-400 dark:focus:bg-gray-800"
        />
      </div>
      <FilterDateRangePicker
        dateFrom={timerFilters.dateFrom}
        dateTo={timerFilters.dateTo}
        onChange={(range) => onTimerFiltersChange(prev => ({ ...prev, ...range }))}
      />
      <MissingMetadataFilterSelect
        value={timerFilters.missingMetadata}
        onChange={(value) => updateFilter('missingMetadata', value)}
      />
      {hasActiveFilters && (
        <>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {filteredTimersCount}/{timersCount}
          </span>
          <button
            onClick={resetFilters}
            className="flex h-10 w-10 items-center justify-center text-gray-500 transition-all hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Reset timer filters"
            title="Reset filters"
          >
            <X className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  );
}

export default function Header({
  timers,
  filteredTimersCount,
  timerFilters,
  isSimpleMode,
  isCheckingMode,
  isDarkMode,
  showDecimalTime,
  showMilliseconds,
  showByDate, // New property
  showFilterBar,
  supportsWidget,
  showWidget,
  showGoals,
  showAffairsAndMissions,
  onDeleteAll,
  onToggleAll,
  onAddTimer,
  onAddTimerWithDate,
  onToggleSimpleMode,
  onToggleCheckingMode,
  onToggleDecimalTime,
  onToggleMilliseconds,
  onToggleDarkMode,
  onDownloadJSON,
  getTotalTime,
  onImportJSON,
  onToggleByDate, // New method
  onToggleFilterBar,
  onToggleWidget, // New method
  onToggleGoals,
  onToggleAffairsAndMissions,
  onTimerFiltersChange,
  currentStickyDate,
}: HeaderProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const mobileSettingsRef = useRef<HTMLDivElement>(null);
  const desktopSettingsRef = useRef<HTMLDivElement>(null);
  const [displayedDate, setDisplayedDate] = useState<string | null>(null);
  const [animating, setAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'up' | 'down'>('up');
  const checkedTimersCount = timers.filter(timer => timer.isChecked).length;
  const deleteConfirmLabel = checkedTimersCount > 0 ? `selected (${checkedTimersCount})` : 'All';

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
                showFilterBar={showFilterBar}
                supportsWidget={supportsWidget}
                showWidget={showWidget}
                showGoals={showGoals}
                showAffairsAndMissions={showAffairsAndMissions}
                hideFilterBarToggle
                onToggleSimpleMode={onToggleSimpleMode}
                onToggleCheckingMode={onToggleCheckingMode}
                onToggleDecimalTime={onToggleDecimalTime}
                onToggleMilliseconds={onToggleMilliseconds}
                onToggleDarkMode={onToggleDarkMode}
                onDownloadJSON={onDownloadJSON}
                onImportJSON={onImportJSON}
                onToggleByDate={onToggleByDate} // New method
                onToggleFilterBar={onToggleFilterBar}
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
              <ConfirmDeleteButton onDelete={onDeleteAll} confirmLabel={deleteConfirmLabel} />
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
            <AddTimerButton
              onAddTimer={onAddTimer}
              onAddTimerWithDate={onAddTimerWithDate}
            />
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
                showFilterBar={showFilterBar}
                supportsWidget={supportsWidget}
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
                onToggleFilterBar={onToggleFilterBar}
                onToggleWidget={onToggleWidget}
                onToggleGoals={onToggleGoals}
                onToggleAffairsAndMissions={onToggleAffairsAndMissions}
              />
            </div>
          </div>
        </div>
        {showFilterBar && (
          <DesktopTimerFilters
            timerFilters={timerFilters}
            timersCount={timers.length}
            filteredTimersCount={filteredTimersCount}
            onTimerFiltersChange={onTimerFiltersChange}
          />
        )}
      </div>
    </div>
  );
}
