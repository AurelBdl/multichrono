import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Play, Pause, GripVertical, Plus, ArrowBigUpDash, Check, CalendarClock } from 'lucide-react';
import useTrelloDrag from './hooks/useTrelloCard';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  DragCancelEvent,
  useDroppable,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { FloatingButton, FloatingButtonItem } from './ui/FloatingButton';
import ConfirmDeleteButton from './ui/ConfirmDeleteButton';
import Header from './components/Header';
import Footer from './components/Footer';
import SortableTimer, { Timer, AffairOption, MissionOption } from './components/SortableTimer';
import PipTimerWidget from './components/PipTimerWidget';

const blurAllInputs = () => {
  const inputs = document.querySelectorAll('input');
  inputs.forEach(input => {
    input.blur();
  });
};

const isEditableElement = (element: Element | null) => {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  return (
    element.tagName === 'INPUT' ||
    element.tagName === 'TEXTAREA' ||
    element.isContentEditable
  );
};

const isAffairOption = (value: unknown): value is AffairOption => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const affair = value as Record<string, unknown>;
  return (
    (typeof affair.id === 'string' || typeof affair.id === 'number') &&
    (typeof affair.code === 'string' || affair.code === null) &&
    typeof affair.name === 'string'
  );
};

const isMissionOption = (value: unknown): value is MissionOption => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const mission = value as Record<string, unknown>;
  return (
    (typeof mission.id === 'string' || typeof mission.id === 'number') &&
    (
      typeof mission.affairId === 'string' ||
      typeof mission.affairId === 'number' ||
      mission.affairId === null
    ) &&
    typeof mission.label === 'string'
  );
};

const parseStoredArray = <T,>(key: string, validator: (value: unknown) => value is T): T[] => {
  const saved = localStorage.getItem(key);
  if (!saved) {
    return [];
  }

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed.filter(validator) : [];
  } catch {
    return [];
  }
};

const hasStoredItems = <T,>(key: string, validator: (value: unknown) => value is T) =>
  parseStoredArray(key, validator).length > 0;

type WindowWithDocumentPictureInPicture = Window & {
  documentPictureInPicture?: DocumentPictureInPicture;
};

type TimerMissingMetadataFilter = 'all' | 'missing-affair-or-mission' | 'checked' | 'not-checked';

type TimerFilters = {
  searchTerm: string;
  dateFrom: string;
  dateTo: string;
  missingMetadata: TimerMissingMetadataFilter;
};

const normalizeTimerSearchText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]/g, '');

const getDocumentPictureInPicture = () => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return (window as WindowWithDocumentPictureInPicture).documentPictureInPicture;
};

interface AffairsAndMissionsModalProps {
  isOpen: boolean;
  initialAffairs: AffairOption[];
  initialMissions: MissionOption[];
  onClose: () => void;
  onSave: (payload: { affairsList: AffairOption[]; missionsList: MissionOption[] }) => void;
}

function AffairsAndMissionsModal({
  isOpen,
  initialAffairs,
  initialMissions,
  onClose,
  onSave,
}: AffairsAndMissionsModalProps) {
  const [affairsValue, setAffairsValue] = useState('[]');
  const [missionsValue, setMissionsValue] = useState('[]');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setAffairsValue(JSON.stringify(initialAffairs, null, 2));
    setMissionsValue(JSON.stringify(initialMissions, null, 2));
    setError(null);
  }, [initialAffairs, initialMissions, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    try {
      const parsedAffairs = JSON.parse(affairsValue);
      const parsedMissions = JSON.parse(missionsValue);

      if (!Array.isArray(parsedAffairs) || !Array.isArray(parsedMissions)) {
        setError('Each field must contain a valid JSON array.');
        return;
      }

      if (parsedAffairs.length === 0 || parsedMissions.length === 0) {
        setError('Both arrays must contain at least one item.');
        return;
      }

      if (!parsedAffairs.every(isAffairOption)) {
        setError('Each affair must contain at least id, code and name. code may be null.');
        return;
      }

      if (!parsedMissions.every(isMissionOption)) {
        setError('Each mission must contain at least id, affairId and label.');
        return;
      }

      const affairIds = new Set(parsedAffairs.map(affair => String(affair.id)));
      const hasInvalidMissionLink = parsedMissions.some(mission =>
        mission.affairId !== '' &&
        mission.affairId !== null &&
        !affairIds.has(String(mission.affairId))
      );
      if (hasInvalidMissionLink) {
        setError('Each non-empty mission.affairId must match an existing affair id.');
        return;
      }

      onSave({
        affairsList: parsedAffairs,
        missionsList: parsedMissions,
      });
    } catch {
      setError('Please enter valid JSON for both arrays.');
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-800"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Toggle Affairs and Missions</h2>
          {/* <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Fill in both arrays with valid JSON objects. Affairs need <code>id</code>, <code>code</code>, <code>name</code>; <code>code</code> may be <code>null</code> or an empty string, and <code>name</code> may be an empty string. Missions need <code>id</code>, <code>affairId</code>, <code>label</code>, and <code>affairId</code> may be <code>null</code> or an empty string.
          </p> */}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">affairsList</span>
            <textarea
              value={affairsValue}
              onChange={(event) => setAffairsValue(event.target.value)}
              className="h-56 w-full rounded-xl border border-gray-300 bg-gray-50 p-3 font-mono text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">missionsList</span>
            <textarea
              value={missionsValue}
              onChange={(event) => setMissionsValue(event.target.value)}
              className="h-56 w-full rounded-xl border border-gray-300 bg-gray-50 p-3 font-mono text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            />
          </label>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function DroppableDateGroup({ date, children }: { date: string; isActiveDrop: boolean; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id: `date-${date}` });
  return (
    <div ref={setNodeRef} className={`mb-10 rounded-xl transition-all duration-150 `}>
      {children}
    </div>
  );
}

interface AddTimerDateModalProps {
  isOpen: boolean;
  initialDate: Date;
  onClose: () => void;
  onConfirm: (date: Date) => void;
}

const formatDateInputValue = (dateValue: Date) => {
  const year = dateValue.getFullYear();
  const month = (dateValue.getMonth() + 1).toString().padStart(2, '0');
  const day = dateValue.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateInputValue = (dateValue: string) => {
  const [year, month, day] = dateValue.split('-').map(Number);
  return new Date(year, month - 1, day);
};

function AddTimerDateModal({
  isOpen,
  initialDate,
  onClose,
  onConfirm,
}: AddTimerDateModalProps) {
  const [selectedDate, setSelectedDate] = useState(formatDateInputValue(initialDate));

  useEffect(() => {
    if (isOpen) {
      setSelectedDate(formatDateInputValue(initialDate));
    }
  }, [initialDate, isOpen]);

  if (!isOpen) {
    return null;
  }

  const close = () => {
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }
    onClose();
  };

  const confirm = () => {
    if (!selectedDate) {
      return;
    }

    onConfirm(parseDateInputValue(selectedDate));
    close();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in-0 duration-150"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          close();
        }
        if (event.key === 'Enter') {
          confirm();
        }
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          close();
        }
      }}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] pointer-events-none" />
      <div
        className="relative w-[calc(100vw-2rem)] max-w-80 rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl animate-in zoom-in-95 duration-150 dark:border-gray-700 dark:bg-gray-800 sm:p-6"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-white">
            <CalendarClock className="h-4 w-4 text-indigo-500" />
            Timer date
          </h3>
          <button onClick={close} className="text-lg leading-none text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200">✕</button>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-xs text-gray-500 dark:text-gray-400">Date</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            autoFocus
            className="block w-full min-w-0 max-w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-base text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700/60 dark:text-white"
          />
        </label>

        <div className="mt-6 flex">
          <button
            onClick={confirm}
            disabled={!selectedDate}
            className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function App() {
  const supportsDocumentPictureInPicture =
    typeof getDocumentPictureInPicture()?.requestWindow === 'function';

  const [timers, setTimers] = useState<Timer[]>(() => {
    const saved = localStorage.getItem('timers');
    if (!saved || saved.length == 0) {
      return [
        {
          id: crypto.randomUUID(),
          name: 'Timer 1',
          time: 0,
          isRunning: false,
          startTime: null,
          isChecked: false,
          creationDate: new Date(),
          hasBeenRendered: false
        }
      ];
    }
    const parsedTimers: Timer[] = JSON.parse(saved);
    return parsedTimers.map(timer => {
      const normalizedTimer = {
        ...timer,
        isChecked: typeof timer.isChecked === 'boolean' ? timer.isChecked : false
      };
      if (normalizedTimer.isRunning && normalizedTimer.startTime) {
        const now = Date.now();
        const elapsedSinceLastSave = now - normalizedTimer.startTime;
        return {
          ...normalizedTimer,
          time: normalizedTimer.time + elapsedSinceLastSave,
          startTime: now
        };
      }
      return normalizedTimer;
    });
  });

  const [showMilliseconds, setShowMilliseconds] = useState(() => {
    const saved = localStorage.getItem('showMilliseconds');
    return saved ? JSON.parse(saved) : false;
  });
  const [showDecimalTime, setShowDecimalTime] = useState(() => {
    const saved = localStorage.getItem('showDecimalTime');
    return saved ? JSON.parse(saved) : false;
  });
  const [isSimpleMode, setIsSimpleMode] = useState(() => {
    const saved = localStorage.getItem('isSimpleMode');
    return saved ? JSON.parse(saved) : true;
  });
  const [isCheckingMode, setIsCheckingMode] = useState(() => {
    const saved = localStorage.getItem('isCheckingMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('isDarkMode');
    return saved ? JSON.parse(saved) : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [showByDate, setShowByDate] = useState(() => {
    const saved = localStorage.getItem('showByDate');
    return saved ? JSON.parse(saved) : false;
  });
  const [showFilterBar, setShowFilterBar] = useState(() => {
    const saved = localStorage.getItem('showFilterBar');
    return saved ? JSON.parse(saved) : false;
  });
  const [showGoals, setShowGoals] = useState(() => {
    const saved = localStorage.getItem('showGoals');
    return saved ? JSON.parse(saved) : false;
  });
  const [showAffairsAndMissions, setShowAffairsAndMissions] = useState(() => {
    const saved = localStorage.getItem('showAffairsAndMissions');
    return saved ? JSON.parse(saved) : false;
  });
  const [showAffairsAndMissionsModal, setShowAffairsAndMissionsModal] = useState(false);
  const [affairsList, setAffairsList] = useState<AffairOption[]>(() => parseStoredArray('affairsList', isAffairOption));
  const [missionsList, setMissionsList] = useState<MissionOption[]>(() => parseStoredArray('missionsList', isMissionOption));
  const [modalInitialAffairs, setModalInitialAffairs] = useState<AffairOption[]>([]);
  const [modalInitialMissions, setModalInitialMissions] = useState<MissionOption[]>([]);
  const [showAddTimerDateModal, setShowAddTimerDateModal] = useState(false);
  const [addTimerInitialDate, setAddTimerInitialDate] = useState(() => new Date());
  const [pendingNameFocusTimerId, setPendingNameFocusTimerId] = useState<string | null>(null);
  const [currentStickyDate, setCurrentStickyDate] = useState<string | null>(null);
  const [timerFilters, setTimerFilters] = useState<TimerFilters>({
    searchTerm: '',
    dateFrom: '',
    dateTo: '',
    missingMetadata: 'all',
  });

  const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null);
  const [pipContainer, setPipContainer] = useState<HTMLElement | null>(null);
  const [activeDragTimer, setActiveDragTimer] = useState<Timer | null>(null);
  const [overDateKey, setOverDateKey] = useState<string | null>(null);
  const originalTimersRef = useRef<Timer[]>([]);
  const timersRef = useRef<Timer[]>(timers);

  // Garder les références à jour
  useEffect(() => {
    timersRef.current = timers;
  }, [timers]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('showByDate', JSON.stringify(showByDate));
  }, [showByDate]);

  useEffect(() => {
    localStorage.setItem('showFilterBar', JSON.stringify(showFilterBar));
  }, [showFilterBar]);

  useEffect(() => {
    localStorage.setItem('showGoals', JSON.stringify(showGoals));
  }, [showGoals]);

  useEffect(() => {
    localStorage.setItem('showAffairsAndMissions', JSON.stringify(showAffairsAndMissions));
  }, [showAffairsAndMissions]);

  useEffect(() => {
    if (!showAffairsAndMissions) {
      setShowAffairsAndMissionsModal(false);
      return;
    }

    if (
      hasStoredItems('affairsList', isAffairOption) &&
      hasStoredItems('missionsList', isMissionOption)
    ) {
      return;
    }

    setModalInitialAffairs(parseStoredArray('affairsList', isAffairOption));
    setModalInitialMissions(parseStoredArray('missionsList', isMissionOption));
    setShowAffairsAndMissionsModal(true);
  }, [showAffairsAndMissions]);

  // Detect which date group header is at the top of the viewport (behind sticky header)
  useEffect(() => {
    if (!showByDate) {
      setCurrentStickyDate(null);
      return;
    }
    const handleScroll = () => {
      const headerEl = document.querySelector('[data-sticky-header]');
      const headerBottom = headerEl ? headerEl.getBoundingClientRect().bottom : 80;
      const dateHeaders = document.querySelectorAll<HTMLElement>('[data-date-group]');
      let found: string | null = null;
      dateHeaders.forEach(el => {
        if (el.getBoundingClientRect().top <= headerBottom) {
          found = el.getAttribute('data-date-group');
        }
      });
      setCurrentStickyDate(found);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showByDate, timers]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Tick every second to keep totals (header + date groups) up to date while a timer runs
  const [, setTick] = useState(0);
  useEffect(() => {
    const hasRunning = timers.some(t => t.isRunning);
    if (!hasRunning) return;
    const id = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(id);
  }, [timers.some(t => t.isRunning)]);

  // Periodic localStorage save every 2s (captures live time for running timers)
  useEffect(() => {
    const save = () => {
      const now = Date.now();
      const snapshot = timersRef.current.map(t =>
        t.isRunning && t.startTime
          ? { ...t, time: t.time + (now - t.startTime), startTime: now }
          : t
      );
      localStorage.setItem('timers', JSON.stringify(snapshot));
    };
    const id = setInterval(save, 2000);
    window.addEventListener('beforeunload', save);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') save();
    });
    return () => {
      clearInterval(id);
      window.removeEventListener('beforeunload', save);
      save();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('showMilliseconds', JSON.stringify(showMilliseconds));
  }, [showMilliseconds]);

  useEffect(() => {
    localStorage.setItem('showDecimalTime', JSON.stringify(showDecimalTime));
  }, [showDecimalTime]);

  useEffect(() => {
    localStorage.setItem('isSimpleMode', JSON.stringify(isSimpleMode));
  }, [isSimpleMode]);

  useEffect(() => {
    localStorage.setItem('isCheckingMode', JSON.stringify(isCheckingMode));
  }, [isCheckingMode]);

  useEffect(() => {
    localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const setTimerIsRendered = (id: string) => {
    setTimers(prev => {
      const newTimers = prev.map(timer =>
        timer.id === id ? { ...timer, hasBeenRendered: true } : timer
      );
      return newTimers;
    });
  };

  const addTimer = ({
    name = 'Timer ' + (timers.length + 1),
    creationDate = new Date(),
    insertFirstInDay = false
  }: {
    name?: string;
    creationDate?: Date;
    insertFirstInDay?: boolean;
  }) => {
    const formatDateKey = (dateValue: Date) => {
      const year = dateValue.getFullYear();
      const month = (dateValue.getMonth() + 1).toString().padStart(2, '0');
      const day = dateValue.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const newTimer: Timer = {
      id: crypto.randomUUID(),
      name: name,
      time: 0,
      isRunning: false,
      startTime: null,
      isChecked: false,
      creationDate,
      hasBeenRendered: false
    };
    setPendingNameFocusTimerId(newTimer.id);
    setTimers(prev => {
      let newTimers = [...prev, newTimer];

      if (insertFirstInDay) {
        const targetDateKey = formatDateKey(creationDate);
        const firstTimerIndexForDay = prev.findIndex((timer) => {
          const timerDate = new Date(timer.creationDate ? timer.creationDate : new Date());
          return formatDateKey(timerDate) === targetDateKey;
        });

        if (firstTimerIndexForDay !== -1) {
          newTimers = [
            ...prev.slice(0, firstTimerIndexForDay),
            newTimer,
            ...prev.slice(firstTimerIndexForDay)
          ];
        }
      }

      localStorage.setItem('timers', JSON.stringify(newTimers));
      return newTimers;
    });
  };

  const addTimerRef = useRef(addTimer);
  useEffect(() => { addTimerRef.current = addTimer; });

  const openAddTimerDateModal = () => {
    setAddTimerInitialDate(new Date());
    setShowAddTimerDateModal(true);
  };

  const handleAddTimerWithDate = (creationDate: Date) => {
    addTimer({
      name: 'Timer ' + (timers.length + 1),
      creationDate,
    });
  };

  const selectedTimerCount = timers.filter(timer => timer.isChecked).length;
  const deleteConfirmLabel = selectedTimerCount > 0 ? `selected (${selectedTimerCount})` : 'All';

  const deleteAllTimers = () => {
    const shouldDeleteSelectedOnly = selectedTimerCount > 0;
    const timersToDelete = timers.filter(timer => shouldDeleteSelectedOnly ? timer.isChecked : true);
    const hasAnimatedElement = timersToDelete.some(timer => {
      const element = document.getElementById(`timer-${timer.id}`);
      if (element) {
        element.classList.add('animate-out', 'fade-out-0', 'zoom-out', 'duration-300');
        return true;
      }
      return false;
    });

    const deleteTimers = () => {
      setTimers(prev => {
        const newTimers = shouldDeleteSelectedOnly
          ? prev.filter(timer => !timer.isChecked)
          : [];

        if (newTimers.length === 0) {
          localStorage.removeItem('timers');
        } else {
          localStorage.setItem('timers', JSON.stringify(newTimers));
        }

        return newTimers;
      });
    };

    if (hasAnimatedElement) {
      setTimeout(deleteTimers, 300);
    } else {
      deleteTimers();
    }
  }

  const toggleTimer = (id: string) => {
    blurAllInputs();
    const now = Date.now();
    const timer = timers.find(t => t.id === id);
    if (isSimpleMode && timer && !timer.isRunning) {
      setTimers(prev => {
        const newTimers = prev.map(t =>
          t.isRunning ? {
            ...t,
            isRunning: false,
            time: t.time + (now - (t.startTime ?? now)),
            startTime: null
          } : t
        );
        localStorage.setItem('timers', JSON.stringify(newTimers));
        return newTimers;
      });
    }
    setTimers(prev => {
      const newTimers = prev.map(t =>
        t.id === id ? {
          ...t,
          isRunning: !t.isRunning,
          startTime: !t.isRunning ? now : null,
          time: t.isRunning ? t.time + (now - (t.startTime ?? now)) : t.time
        } : t
      );
      localStorage.setItem('timers', JSON.stringify(newTimers));
      return newTimers;
    });
  };

  const resetTimer = (id: string) => {
    setTimers(prev => {
      const newTimers = prev.map(timer =>
        timer.id === id ? {
          ...timer,
          time: 0,
          isRunning: false,
          startTime: null
        } : timer
      );
      localStorage.setItem('timers', JSON.stringify(newTimers));
      return newTimers;
    });
  };

  const toggleTimerChecking = (id: string) => {
    setTimers(prev => {
      const newTimers = prev.map(timer =>
        timer.id === id ? { ...timer, isChecked: !timer.isChecked } : timer
      );
      localStorage.setItem('timers', JSON.stringify(newTimers));
      return newTimers;
    });
  };

  const getTimerDateKey = (timer: Timer) => {
    const timerDate = new Date(timer.creationDate ? timer.creationDate : new Date());
    const year = timerDate.getFullYear();
    const month = (timerDate.getMonth() + 1).toString().padStart(2, '0');
    const day = timerDate.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const toggleDateChecking = (dateKey: string) => {
    setTimers(prev => {
      const timersForDate = prev.filter(timer => getTimerDateKey(timer) === dateKey);
      if (timersForDate.length === 0) {
        return prev;
      }

      const shouldCheckAll = !timersForDate.every(timer => timer.isChecked);
      const newTimers = prev.map(timer =>
        getTimerDateKey(timer) === dateKey ? { ...timer, isChecked: shouldCheckAll } : timer
      );
      localStorage.setItem('timers', JSON.stringify(newTimers));
      return newTimers;
    });
  };

  const deleteTimer = (id: string) => {
    setTimers(prev => {
      const newTimers = prev.filter(timer => timer.id !== id);
      localStorage.setItem('timers', JSON.stringify(newTimers));
      return newTimers;
    });
  };

  const updateTimerName = (id: string, name: string) => {
    setTimers(prev => {
      const newTimers = prev.map(timer =>
        timer.id === id ? { ...timer, name } : timer
      );
      localStorage.setItem('timers', JSON.stringify(newTimers));
      return newTimers;
    });
  };

  const updateTimerHour = (id: string, hour: number, prevHour: number) => {
    setTimers(prev => {
      const newTimers = prev.map(timer =>
        timer.id === id ? { ...timer, time: timer.time - prevHour * 3600000 + hour * 3600000 } : timer
      );
      localStorage.setItem('timers', JSON.stringify(newTimers));
      return newTimers;
    });
  }

  const updateTimerMinute = (id: string, minute: number, prevMinute: number) => {
    setTimers(prev => {
      const newTimers = prev.map(timer =>
        timer.id === id ? { ...timer, time: timer.time - prevMinute * 60000 + minute * 60000 } : timer
      );
      localStorage.setItem('timers', JSON.stringify(newTimers));
      return newTimers;
    });
  }

  const updateTimerSecond = (id: string, second: number, prevSecond: number) => {
    setTimers(prev => {
      const newTimers = prev.map(timer =>
        timer.id === id ? { ...timer, time: timer.time - prevSecond * 1000 + second * 1000 } : timer
      );
      localStorage.setItem('timers', JSON.stringify(newTimers));
      return newTimers;
    });
  }

  const updateTimerGoal = (id: string, goalMs: number | null) => {
    setTimers(prev => {
      const newTimers = prev.map(timer =>
        timer.id === id ? { ...timer, goalTime: goalMs } : timer
      );
      localStorage.setItem('timers', JSON.stringify(newTimers));
      return newTimers;
    });
  };

  const updateTimerAffair = (id: string, affairId: string | number | null) => {
    setTimers(prev => {
      const newTimers = prev.map(timer =>
        timer.id === id ? { ...timer, affairId } : timer
      );
      localStorage.setItem('timers', JSON.stringify(newTimers));
      return newTimers;
    });
  };

  const updateTimerMission = (id: string, missionId: string | number | null) => {
    setTimers(prev => {
      const newTimers = prev.map(timer =>
        timer.id === id ? { ...timer, missionId } : timer
      );
      localStorage.setItem('timers', JSON.stringify(newTimers));
      return newTimers;
    });
  };

  const updateTimerDate = (id: string, newDate: string) => {
    setTimers(prev => {
      const newTimers = prev.map(timer => {
        if (timer.id !== id) return timer;
        const [year, month, day] = newDate.split('-').map(Number);
        const updatedDate = new Date(timer.creationDate || new Date());
        updatedDate.setFullYear(year, month - 1, day);
        return { ...timer, creationDate: updatedDate };
      });
      localStorage.setItem('timers', JSON.stringify(newTimers));
      return newTimers;
    });
  };

  const toggleAllTimers = () => {
    blurAllInputs();
    const now = Date.now();
    const atLeastOneRunning = timers.some(t => t.isRunning);
    setTimers(prev => {
      const newTimers = prev.map(t => ({
        ...t,
        isRunning: !atLeastOneRunning,
        startTime: !atLeastOneRunning ? now : null,
        time: atLeastOneRunning && t.isRunning ? t.time + (now - (t.startTime ?? now)) : t.time
      }));
      localStorage.setItem('timers', JSON.stringify(newTimers));
      return newTimers;
    });
  };

  const toggleWidget = async () => {
    const documentPictureInPicture = getDocumentPictureInPicture();
    if (!documentPictureInPicture) {
      return;
    }

    // If PiP is already open, close it
    if (documentPictureInPicture.window) {
      documentPictureInPicture.window.close();
      setPipContainer(null);
      setActiveWidgetId(null);
      return;
    }

    try {
      const pipWindow = await documentPictureInPicture.requestWindow({
        width: 255,
        height: 200,
        preferInitialWindowPlacement: true
      });

      // Copy stylesheets so Tailwind classes work
      [...document.styleSheets].forEach((styleSheet) => {
        try {
          const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
          const style = document.createElement('style');
          style.textContent = cssRules;
          pipWindow.document.head.appendChild(style);
        } catch {
          if (styleSheet.href) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = styleSheet.type;
            link.media = styleSheet.media.mediaText;
            link.href = styleSheet.href;
            pipWindow.document.head.appendChild(link);
          }
        }
      });

      // Set up the PiP document
      pipWindow.document.documentElement.style.height = '100%';
      pipWindow.document.body.style.margin = '0';
      pipWindow.document.body.style.height = '100%';

      // Apply dark mode
      if (isDarkMode) {
        pipWindow.document.documentElement.classList.add('dark');
        pipWindow.document.documentElement.style.colorScheme = 'dark';
      }

      // Create React portal container
      const container = pipWindow.document.createElement('div');
      container.id = 'pip-root';
      container.style.height = '100%';
      pipWindow.document.body.appendChild(container);

      setPipContainer(container);
      setActiveWidgetId('widget-active');

      // Cleanup on PiP window close
      pipWindow.addEventListener('pagehide', () => {
        setPipContainer(null);
        setActiveWidgetId(null);
      });
    } catch (error) {
      console.error('Error opening Document PiP:', error);
      setActiveWidgetId(null);
    }
  };

  const handleToggleAffairsAndMissions = () => {
    setShowAffairsAndMissions(prev => !prev);
  };

  const handleCloseAffairsAndMissionsModal = () => {
    setShowAffairsAndMissionsModal(false);

    if (!hasStoredItems('affairsList', isAffairOption) || !hasStoredItems('missionsList', isMissionOption)) {
      setShowAffairsAndMissions(false);
    }
  };

  const handleSaveAffairsAndMissions = ({
    affairsList,
    missionsList,
  }: {
    affairsList: AffairOption[];
    missionsList: MissionOption[];
  }) => {
    localStorage.setItem('affairsList', JSON.stringify(affairsList));
    localStorage.setItem('missionsList', JSON.stringify(missionsList));
    setAffairsList(affairsList);
    setMissionsList(missionsList);
    setShowAffairsAndMissions(true);
    setShowAffairsAndMissionsModal(false);
  };

  // Sync dark mode to PiP window
  useEffect(() => {
    const pipWindow = getDocumentPictureInPicture()?.window;
    if (!pipWindow) return;
    if (isDarkMode) {
      pipWindow.document.documentElement.classList.add('dark');
      pipWindow.document.documentElement.style.colorScheme = 'dark';
    } else {
      pipWindow.document.documentElement.classList.remove('dark');
      pipWindow.document.documentElement.style.colorScheme = 'light';
    }
  }, [isDarkMode, pipContainer]);

  // Cleanup PiP on unmount
  useEffect(() => {
    return () => {
      const documentPictureInPicture = getDocumentPictureInPicture();
      if (documentPictureInPicture?.window) {
        documentPictureInPicture.window.close();
      }
    };
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    const timer = timers.find(t => t.id === event.active.id);
    setActiveDragTimer(timer ?? null);
    originalTimersRef.current = timers;
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (!showByDate) return;
    const { active, over } = event;
    if (!over) { setOverDateKey(null); return; }
    if (active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Mettre à jour la date survolée
    if (overId.startsWith('date-')) {
      setOverDateKey(overId.replace('date-', ''));
    } else {
      const grouped = groupTimersByDate(timers);
      const foundDate = Object.entries(grouped).find(([, dt]) => dt.some(t => t.id === overId))?.[0] ?? null;
      setOverDateKey(foundDate);
    }

    // Ignorer les zones de date (géré dans dragEnd)
    if (overId.startsWith('date-')) return;

    setTimers(prev => {
      const grouped = groupTimersByDate(prev);
      const activeDate = Object.entries(grouped).find(([, dt]) => dt.some(t => t.id === activeId))?.[0];
      const overDate = Object.entries(grouped).find(([, dt]) => dt.some(t => t.id === overId))?.[0];

      // Même groupe : laisser SortableContext gérer le visuel, pas de mise à jour d'état
      if (!overDate || activeDate === overDate) return prev;

      // Groupe différent : changer la date + repositionner
      let newTimers = prev.map(timer => {
        if (timer.id !== activeId) return timer;
        const [year, month, day] = overDate.split('-').map(Number);
        const updatedDate = new Date(timer.creationDate || new Date());
        updatedDate.setFullYear(year, month - 1, day);
        return { ...timer, creationDate: updatedDate };
      });

      const activeIndex = newTimers.findIndex(t => t.id === activeId);
      const overIndex = newTimers.findIndex(t => t.id === overId);
      if (activeIndex !== -1 && overIndex !== -1) {
        newTimers = arrayMove(newTimers, activeIndex, overIndex);
      }

      return newTimers;
    });
  };

  const handleDragCancel = (_event: DragCancelEvent) => {
    setActiveDragTimer(null);
    setOverDateKey(null);
    const original = originalTimersRef.current;
    if (original.length > 0) {
      setTimers(original);
      localStorage.setItem('timers', JSON.stringify(original));
      originalTimersRef.current = [];
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragTimer(null);
    setOverDateKey(null);
    originalTimersRef.current = [];
    const { active, over } = event;

    if (!over || active.id === over.id) {
      // Pas de déplacement, juste sauvegarder l'état courant
      setTimers(prev => { localStorage.setItem('timers', JSON.stringify(prev)); return prev; });
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    if (showByDate) {
      // Dropped on a date zone (espace vide d'un groupe)
      if (overId.startsWith('date-')) {
        const targetDate = overId.replace('date-', '');
        updateTimerDate(activeId, targetDate);
        return;
      }

      // Cross-group déjà géré dans onDragOver, same-group : réordonner
      const grouped = groupTimersByDate(timers);
      const activeDate = Object.entries(grouped).find(([, dt]) => dt.some(t => t.id === activeId))?.[0];
      const overDate = Object.entries(grouped).find(([, dt]) => dt.some(t => t.id === overId))?.[0];

      if (activeDate === overDate) {
        setTimers(items => {
          const oldIndex = items.findIndex(item => item.id === activeId);
          const newIndex = items.findIndex(item => item.id === overId);
          const newTimers = arrayMove(items, oldIndex, newIndex);
          localStorage.setItem('timers', JSON.stringify(newTimers));
          return newTimers;
        });
      } else {
        // Cross-group déjà mis à jour dans onDragOver, juste sauvegarder
        setTimers(prev => { localStorage.setItem('timers', JSON.stringify(prev)); return prev; });
      }
      return;
    }

    setTimers(items => {
      const oldIndex = items.findIndex(item => item.id === activeId);
      const newIndex = items.findIndex(item => item.id === overId);
      const newTimers = arrayMove(items, oldIndex, newIndex);
      localStorage.setItem('timers', JSON.stringify(newTimers));
      return newTimers;
    });
  };

  const formatTime = (ms: number) => {
    const milliseconds = ms % 1000;
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    return { hours, minutes, seconds, milliseconds };
  };

  const getTotalTime = () => {
    const now = Date.now();
    const totalms = timers.reduce((acc, timer) => acc + timer.time + (timer.isRunning && timer.startTime ? now - timer.startTime : 0), 0);
    return formatTime(totalms).hours.toString().padStart(2, '0') + ':' + (formatTime(totalms).minutes % 60).toString().padStart(2, '0') + ':' + (formatTime(totalms).seconds % 60).toString().padStart(2, '0');
  }

  const handlePaste = async () => {
    const text = await navigator.clipboard.readText();
    if (text.startsWith('https://trello.com/c/')) {
      const title = extractTitleFromTrelloUrl(text);
      addTimer({ name: title });
    }
    else {
      addTimer({ name: text });
    }
  };

  const extractTitleFromTrelloUrl = (url) => {
    const lastPart = url.split('/').pop();
    const encodedTitle = lastPart.split('-').slice(1).join('-');
    const decodedTitle = decodeURIComponent(encodedTitle);
    return decodedTitle.replace(/-/g, ' ');
  }

  const handleContextMenu = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.closest('.timer-container')) {
      return;
    }
    event.preventDefault();
    const menu = document.getElementById('context-menu');
    if (menu) {
      menu.style.top = `${event.clientY}px`;
      menu.style.left = `${event.clientX}px`;
      menu.style.display = 'block';
    }
  };

  const handleClick = () => {
    const menu = document.getElementById('context-menu');
    if (menu) {
      menu.style.display = 'none';
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'v' && !isEditableElement(document.activeElement)) {
        handlePaste();
      }
      if (event.altKey && event.key === 'n' && !document.querySelector('.fixed.inset-0.z-50')) {
        event.preventDefault();
        addTimerRef.current({});
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  const handleNativeDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };
  const hoveredCard = useTrelloDrag();
  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    if (!hoveredCard) return;
  };

  const convertToDecimalTime = ({ hour, minutes }: { hour: number, minutes: number }) => {
    if (typeof hour !== 'number' || typeof minutes !== 'number') {
      throw new Error('Les propriétés hour et minutes doivent être des nombres.');
    }

    let decimalTime = hour + minutes / 60;
    decimalTime = Math.round(decimalTime * 20) / 20;

    return decimalTime;
  }

  const downloadJSON = () => {
    const shouldExportSelectedOnly = selectedTimerCount > 0;
    const timersToExport = shouldExportSelectedOnly
      ? timers.filter(timer => timer.isChecked)
      : timers;

    const timersWithDecimalTime = timersToExport.map(timer => ({
      ...timer,
      isRunning: false,
      decimalTime: convertToDecimalTime({
        hour: formatTime(timer.time).hours,
        minutes: formatTime(timer.time).minutes % 60
      })
    }));

    const jsonContent = JSON.stringify(timersWithDecimalTime, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `timers-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isValidTimer = (timer: any): timer is Timer => {
    return (
      typeof timer.id === 'string' &&
      typeof timer.name === 'string' &&
      typeof timer.time === 'number' &&
      typeof timer.isRunning === 'boolean' &&
      (typeof timer.startTime === 'number' || timer.startTime === null)
    );
  };

  const importJSON = (jsonContent: string) => {
    try {
      const importedTimers: Timer[] = JSON.parse(jsonContent).map(timer => {
        if (!isValidTimer(timer)) {
          window.alert('Invalid timer structure');
          throw new Error('Invalid timer structure');
        }
        return {
          ...timer,
          id: crypto.randomUUID(),
          isChecked: typeof timer.isChecked === 'boolean' ? timer.isChecked : false,
          affairId: typeof timer.affairId === 'string' || typeof timer.affairId === 'number' ? timer.affairId : null,
          missionId: typeof timer.missionId === 'string' || typeof timer.missionId === 'number' ? timer.missionId : null,
        };
      });
      setTimers(prev => {
        const newTimers = [...prev, ...importedTimers];
        localStorage.setItem('timers', JSON.stringify(newTimers));
        return newTimers;
      });
    } catch (error) {
      console.error('Failed to import JSON:', error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        importJSON(content);
      };
      reader.readAsText(file);
    }
  };

  const groupTimersByDate = (timers: Timer[]) => {
    const formatDateKey = (dateValue: Date) => {
      const year = dateValue.getFullYear();
      const month = (dateValue.getMonth() + 1).toString().padStart(2, '0');
      const day = dateValue.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const parseDateKey = (dateKey: string) => {
      const [year, month, day] = dateKey.split('-').map(Number);
      return new Date(year, month - 1, day);
    };

    const grouped = timers.reduce((groups, timer) => {
      const date = formatDateKey(new Date(timer.creationDate ? timer.creationDate : new Date()));
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(timer);
      return groups;
    }, {} as Record<string, Timer[]>);

    return Object.keys(grouped)
      .sort((a, b) => parseDateKey(b).getTime() - parseDateKey(a).getTime())
      .reduce((sortedGroups, date) => {
        sortedGroups[date] = grouped[date];
        return sortedGroups;
      }, {} as Record<string, Timer[]>);
  };

  const getTotalTimeForDate = (timers: Timer[]) => {
    const now = Date.now();
    const totalms = timers.reduce((acc, timer) => acc + timer.time + (timer.isRunning && timer.startTime ? now - timer.startTime : 0), 0);
    return formatTime(totalms).hours.toString().padStart(2, '0') + ':' + (formatTime(totalms).minutes % 60).toString().padStart(2, '0') + ':' + (formatTime(totalms).seconds % 60).toString().padStart(2, '0');
  };

  const filteredTimers = useMemo(() => {
    const normalizedSearchTerm = normalizeTimerSearchText(timerFilters.searchTerm.trim());

    return timers.filter(timer => {
      if (
        normalizedSearchTerm &&
        !normalizeTimerSearchText(timer.name).includes(normalizedSearchTerm)
      ) {
        return false;
      }

      const timerDateKey = getTimerDateKey(timer);
      if (timerFilters.dateFrom && timerDateKey < timerFilters.dateFrom) {
        return false;
      }
      if (timerFilters.dateTo && timerDateKey > timerFilters.dateTo) {
        return false;
      }

      const isAffairMissing = timer.affairId == null || String(timer.affairId).trim() === '';
      const isMissionMissing = timer.missionId == null || String(timer.missionId).trim() === '';

      if (timerFilters.missingMetadata === 'missing-affair-or-mission') {
        return isAffairMissing || isMissionMissing;
      }
      if (timerFilters.missingMetadata === 'checked') {
        return timer.isChecked;
      }
      if (timerFilters.missingMetadata === 'not-checked') {
        return !timer.isChecked;
      }

      return true;
    });
  }, [timerFilters, timers]);

  const hasActiveTimerFilters =
    timerFilters.searchTerm.trim() !== '' ||
    timerFilters.dateFrom !== '' ||
    timerFilters.dateTo !== '' ||
    timerFilters.missingMetadata !== 'all';
  const displayedTimers = showFilterBar ? filteredTimers : timers;

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900" onContextMenu={handleContextMenu} onDragOver={handleNativeDragOver} onDrop={handleDrop}>
      <FloatingButton
        triggerContent={
          <button className="flex items-center justify-center h-14 w-14 rounded-full bg-slate-300 dark:bg-slate-700 text-gray-600 dark:text-white/80 z-100">
            <ArrowBigUpDash />
          </button>
        }>
        {timers.length > 0 && (
          <FloatingButtonItem key="deleteAll">
            <ConfirmDeleteButton onDelete={deleteAllTimers} rounded confirmLabel={deleteConfirmLabel} />
          </FloatingButtonItem>
        )}
        {timers.length > 0 && !isSimpleMode && (
          <FloatingButtonItem key="toggleAll">
            <button
              onClick={toggleAllTimers}
              className={`flex items-center ${timers.find(elem => elem.isRunning)
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
                } text-white p-2 h-14 w-14 rounded-full justify-center items-center transition-colors`}
            >
              {timers.find(elem => elem.isRunning) ? (
                <>
                  <Pause className="w-6 h-6" />
                </>
              ) : (
                <>
                  <Play className="w-6 h-6 ml-1" />
                </>
              )}
            </button>
          </FloatingButtonItem>
        )}
        <FloatingButtonItem key="addTimer">
          <button
            onClick={openAddTimerDateModal}
            className="flex items-center justify-center gap-2 bg-indigo-600 dark:bg-indigo-500 text-white p-2 h-14 w-14 rounded-full hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
          >
            <Plus className="w-6 h-6" />
          </button>
        </FloatingButtonItem>
        {/* {items.map((item, index) => (
        <FloatingButtonItem key={'bla'+index}>
          <button
            className={
              'h-12 w-12 rounded-full flex items-center justify-center text-white/80'}>
            {item.icon}
          </button>
        </FloatingButtonItem>
      ))} */}
      </FloatingButton>
      <div id="context-menu" className="hidden fixed bg-white dark:bg-gray-800 shadow-md rounded-lg z-50">
        <button onClick={handlePaste} className="block px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Paste</button>
      </div>

      <Header
        timers={timers}
        isSimpleMode={isSimpleMode}
        isCheckingMode={isCheckingMode}
        isDarkMode={isDarkMode}
        showDecimalTime={showDecimalTime}
        showMilliseconds={showMilliseconds}
        showByDate={showByDate} // New property
        showFilterBar={showFilterBar}
        supportsWidget={supportsDocumentPictureInPicture}
        showWidget={activeWidgetId !== null}
        onDeleteAll={deleteAllTimers}
        onToggleAll={toggleAllTimers}
        onAddTimer={() => addTimer({})}
        onAddTimerWithDate={openAddTimerDateModal}
        onToggleSimpleMode={() => setIsSimpleMode(prev => !prev)}
        onToggleCheckingMode={() => setIsCheckingMode(prev => !prev)}
        onToggleDecimalTime={() => setShowDecimalTime(prev => !prev)}
        onToggleMilliseconds={() => setShowMilliseconds(prev => !prev)}
        onToggleDarkMode={() => setIsDarkMode(prev => !prev)}
        onDownloadJSON={downloadJSON}
        getTotalTime={getTotalTime}
        onImportJSON={handleFileUpload}
        onToggleByDate={() => setShowByDate(prev => !prev)} // New method
        onToggleFilterBar={() => setShowFilterBar(prev => !prev)}
        onToggleWidget={() => toggleWidget()} // New method
        showGoals={showGoals}
        onToggleGoals={() => setShowGoals(prev => !prev)}
        showAffairsAndMissions={showAffairsAndMissions}
        onToggleAffairsAndMissions={handleToggleAffairsAndMissions}
        currentStickyDate={currentStickyDate}
        timerFilters={timerFilters}
        filteredTimersCount={filteredTimers.length}
        onTimerFiltersChange={setTimerFilters}
      />

      <AffairsAndMissionsModal
        isOpen={showAffairsAndMissionsModal}
        initialAffairs={modalInitialAffairs}
        initialMissions={modalInitialMissions}
        onClose={handleCloseAffairsAndMissionsModal}
        onSave={handleSaveAffairsAndMissions}
      />

      <AddTimerDateModal
        isOpen={showAddTimerDateModal}
        initialDate={addTimerInitialDate}
        onClose={() => setShowAddTimerDateModal(false)}
        onConfirm={handleAddTimerWithDate}
      />

      <div className="max-w-12xl mx-auto p-4 sm:p-8 flex-1 w-full">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          {showByDate ? (
            Object.entries(groupTimersByDate(displayedTimers)).map(([date, timers]) => {
              const isDayFullyChecked = timers.length > 0 && timers.every(timer => timer.isChecked);
              return (
                <DroppableDateGroup key={date} date={date} isActiveDrop={overDateKey === date}>
                  <div data-date-group={date} className="flex items-center gap-4 text-gray-800 dark:text-white mb-4">
                    {isCheckingMode && (
                      <label className="flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isDayFullyChecked}
                          onChange={() => toggleDateChecking(date)}
                          className="peer sr-only"
                          aria-label={`Cocher tous les timers du ${date}`}
                        />
                        <span className="flex h-5 w-5 items-center justify-center rounded-md border-2 border-gray-300 bg-white text-transparent shadow-sm transition-all duration-200 ease-out peer-hover:scale-105 peer-checked:border-indigo-500 peer-checked:bg-indigo-500 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-400 peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-white dark:border-gray-600 dark:bg-gray-700 dark:peer-checked:border-indigo-500 dark:peer-checked:bg-indigo-500 dark:peer-focus-visible:ring-indigo-500 dark:peer-focus-visible:ring-offset-gray-800">
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        </span>
                      </label>
                    )}
                    <h2 className={`font-bold text-xl ${isDayFullyChecked ? 'line-through opacity-70' : ''}`}>
                      {(() => {
                        const [year, month, day] = date.split('-').map(Number);
                        return new Date(year, month - 1, day).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        });
                      })()}
                    </h2>
                    <h2 className={`text-lg ${isDayFullyChecked ? 'line-through opacity-70' : ''}`}>{getTotalTimeForDate(timers)}</h2>
                    <button
                      onClick={() => {
                        const [year, month, day] = date.split('-').map(Number);
                        addTimer({
                          creationDate: new Date(year, month - 1, day),
                          insertFirstInDay: true
                        });
                      }}
                      className="ml-auto flex items-center justify-center h-8 w-8 rounded-full text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-200/70 dark:hover:bg-gray-700/70 transition-colors"
                      title="Add a timer to this day"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <SortableContext
                      items={timers}
                      strategy={rectSortingStrategy}
                    >
                      {timers.map((timer) => (
                        <div key={timer.id} id={`timer-${timer.id}`} className="timer-container">
                          <SortableTimer
                            isCheckingMode={isCheckingMode}
                            shouldAutoFocusName={pendingNameFocusTimerId === timer.id}
                            onNameFocusHandled={() => setPendingNameFocusTimerId(null)}
                            onRender={() => setTimerIsRendered(timer.id)}
                            timer={timer}
                            onToggle={toggleTimer}
                            onToggleChecking={toggleTimerChecking}
                            onReset={resetTimer}
                            onDelete={deleteTimer}
                            onNameChange={updateTimerName}
                            onHourChange={updateTimerHour}
                            onMinuteChange={updateTimerMinute}
                            onSecondChange={updateTimerSecond}
                            onGoalChange={updateTimerGoal}
                            onAffairChange={updateTimerAffair}
                            onMissionChange={updateTimerMission}
                            formatTime={formatTime}
                            showMilliseconds={showMilliseconds}
                            showDecimalTime={showDecimalTime}
                            showGoals={showGoals}
                            showAffairsAndMissions={showAffairsAndMissions}
                            affairsList={affairsList}
                            missionsList={missionsList}
                          />
                        </div>
                      ))}
                    </SortableContext>
                  </div>
                </DroppableDateGroup>
              );
            })
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <SortableContext
                items={displayedTimers}
                strategy={rectSortingStrategy}
              >
                {displayedTimers.map((timer) => (
                  <div key={timer.id} id={`timer-${timer.id}`} className="timer-container">
                    <SortableTimer
                      isCheckingMode={isCheckingMode}
                      shouldAutoFocusName={pendingNameFocusTimerId === timer.id}
                      onNameFocusHandled={() => setPendingNameFocusTimerId(null)}
                      onRender={() => setTimerIsRendered(timer.id)}
                      timer={timer}
                      onToggle={toggleTimer}
                      onToggleChecking={toggleTimerChecking}
                      onReset={resetTimer}
                      onDelete={deleteTimer}
                      onNameChange={updateTimerName}
                      onHourChange={updateTimerHour}
                      onMinuteChange={updateTimerMinute}
                      onSecondChange={updateTimerSecond}
                      onGoalChange={updateTimerGoal}
                      onAffairChange={updateTimerAffair}
                      onMissionChange={updateTimerMission}
                      formatTime={formatTime}
                      showMilliseconds={showMilliseconds}
                      showDecimalTime={showDecimalTime}
                      showGoals={showGoals}
                      showAffairsAndMissions={showAffairsAndMissions}
                      affairsList={affairsList}
                      missionsList={missionsList}
                    />
                  </div>
                ))}
              </SortableContext>
            </div>
          )}
          <DragOverlay>
            {activeDragTimer ? (
              <div className="bg-white dark:bg-gray-800 items-center rounded-lg shadow-xl p-4 sm:p-6 opacity-90 rotate-2 cursor-grabbing">
                <div className="flex items-center gap-2 mb-10">
                  <GripVertical className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <span className="flex-1 text-lg font-semibold dark:text-white truncate">{activeDragTimer.name}</span>
                </div>
                <div className="text-4xl font-mono text-center mb-10 dark:text-white">
                  {formatTime(activeDragTimer.time).hours.toString().padStart(2, '0')}
                  :{(formatTime(activeDragTimer.time).minutes % 60).toString().padStart(2, '0')}
                  :{(formatTime(activeDragTimer.time).seconds % 60).toString().padStart(2, '0')}
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {timers.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No timers yet. Click "Add Timer" to create one!
          </div>
        )}
        {showFilterBar && timers.length > 0 && displayedTimers.length === 0 && hasActiveTimerFilters && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No timers match the current filters.
          </div>
        )}
      </div>
      <Footer />

      {pipContainer && createPortal(
        <PipTimerWidget
          timers={timers}
          onToggle={toggleTimer}
          onNameChange={updateTimerName}
          onHourChange={updateTimerHour}
          onMinuteChange={updateTimerMinute}
          onSecondChange={updateTimerSecond}
          formatTime={formatTime}
          showByDate={showByDate}
          showDecimalTime={showDecimalTime}
          showGoals={showGoals}
        />,
        pipContainer
      )}
    </div>
  );
}

export default App;
