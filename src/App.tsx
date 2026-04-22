import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RefreshCw, Trash2, Timer, GripVertical, Plus, ArrowBigUpDash, Check } from 'lucide-react';
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
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FloatingButton, FloatingButtonItem } from './ui/FloatingButton';
import ConfirmDeleteButton from './ui/ConfirmDeleteButton';
import Header from './components/Header';

interface Timer {
  id: string;
  name: string;
  time: number;
  isRunning: boolean;
  startTime: number | null;
  creationDate?: Date;
  isChecked: boolean;
  hasBeenRendered?: boolean;
}

interface SortableTimerProps {
  timer: Timer;
  onToggle: (id: string) => void;
  onToggleChecking: (id: string) => void;
  onReset: (id: string) => void;
  onDelete: (id: string) => void;
  onNameChange: (id: string, name: string) => void;
  onHourChange: (id: string, hour: number, prevHour: number) => void;
  onMinuteChange: (id: string, minute: number, prevMinute: number) => void;
  onSecondChange: (id: string, second: number, prevSecond: number) => void;
  formatTime: (ms: number) => { hours: number, minutes: number, seconds: number, milliseconds: number };
  onRender?: () => void;
  showMilliseconds: boolean;
  showDecimalTime: boolean;
  isCheckingMode: boolean;
  shouldAutoFocusName?: boolean;
  onNameFocusHandled?: () => void;
}

const blurAllInputs = () => {
  const inputs = document.querySelectorAll('input');
  inputs.forEach(input => {
    input.blur();
  });
};

function SortableTimer({ timer, onToggle, onToggleChecking, onReset, onDelete, onNameChange, onHourChange, onMinuteChange, onSecondChange, formatTime, onRender, showMilliseconds, showDecimalTime, isCheckingMode, shouldAutoFocusName, onNameFocusHandled }: SortableTimerProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: timer.id });
  const [isHourEditing, setIsHourEditing] = useState(false);
  const [isMinuteEditing, setIsMinuteEditing] = useState(false);
  const [isSecondEditing, setIsSecondEditing] = useState(false);

  const focusTimeInput = (unit: 'hour' | 'minute' | 'second') => {
    setTimeout(() => {
      document.getElementById(`${unit}-${timer.id}`)?.focus();
    });
  };

  const parseInputValue = (value: string, fallbackValue: string) => {
    const parsedValue = Number.parseInt(value, 10);
    if (!Number.isNaN(parsedValue)) {
      return parsedValue;
    }
    const parsedFallback = Number.parseInt(fallbackValue, 10);
    return Number.isNaN(parsedFallback) ? 0 : parsedFallback;
  };

  const commitHourInput = (input: HTMLInputElement) => {
    onHourChange(timer.id, parseInputValue(input.value, input.defaultValue), Number.parseInt(input.defaultValue, 10));
  };

  const commitMinuteInput = (input: HTMLInputElement) => {
    onMinuteChange(timer.id, parseInputValue(input.value, input.defaultValue), Number.parseInt(input.defaultValue, 10));
  };

  const commitSecondInput = (input: HTMLInputElement) => {
    onSecondChange(timer.id, parseInputValue(input.value, input.defaultValue), Number.parseInt(input.defaultValue, 10));
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  useEffect(() => {
    if (onRender) {
      setTimeout(() => {
        onRender();
      }, 300);
    }
  }, []);

  const convertToDecimalTime = ({ hour, minutes }: { hour: number, minutes: number }) => {
    if (typeof hour !== 'number' || typeof minutes !== 'number') {
      throw new Error('Les propriétés hour et minutes doivent être des nombres.');
    }

    let decimalTime = hour + minutes / 60;
    decimalTime = Math.round(decimalTime * 20) / 20;

    return decimalTime;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-gray-800 items-center rounded-lg shadow-md p-4 sm:p-6 ${timer.isChecked ? 'ring-2 ring-green-300 dark:ring-green-700 bg-green-50/50 dark:bg-green-900/20' : ''} ${!timer.hasBeenRendered ? 'animate-in fade-in-0 duration-300 zoom-in' : ''}`}
    >
      <div className="flex items-center gap-2 mb-10">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded touch-none"
          title="Drag timer"
        >
          <GripVertical className="w-5 h-5 text-gray-400 dark:text-gray-500" />
        </div>
        {isCheckingMode && (
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={timer.isChecked}
              onChange={() => onToggleChecking(timer.id)}
              className="peer sr-only"
              aria-label={`Cocher le timer ${timer.name}`}
              title='Check timer'
            />
            <span className="flex h-5 w-5 items-center justify-center rounded-md border-2 border-gray-300 bg-white text-transparent shadow-sm transition-all duration-200 ease-out peer-hover:scale-105 peer-checked:border-indigo-500 peer-checked:bg-indigo-500 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-400 peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-white dark:border-gray-600 dark:bg-gray-700 dark:peer-checked:border-indigo-500 dark:peer-checked:bg-indigo-500 dark:peer-focus-visible:ring-indigo-500 dark:peer-focus-visible:ring-offset-gray-800">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
          </label>
        )}
        <input
          id={`name-${timer.id}`}
          type="text"
          value={timer.name}
          title={timer.name}
          autoFocus={shouldAutoFocusName}
          onFocus={(e) => {
            e.target.select();
            if (shouldAutoFocusName) {
              onNameFocusHandled?.();
            }
          }}
          onChange={(e) => onNameChange(timer.id, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Tab') {
              e.preventDefault();
              if (e.shiftKey) {
                setIsHourEditing(false);
                setIsMinuteEditing(false);
                setIsSecondEditing(true);
                focusTimeInput('second');
                return;
              }
              setIsHourEditing(true);
              setIsMinuteEditing(false);
              setIsSecondEditing(false);
              focusTimeInput('hour');
            }
          }}
          className={`flex-1 text-lg font-semibold bg-transparent border-b border-gray-200 dark:border-gray-700 focus:border-indigo-600 dark:focus:border-indigo-500 focus:outline-none pb-1 dark:text-white ${timer.isChecked ? 'line-through opacity-70' : ''}`}
        />
      </div>
      <div className={`text-4xl font-mono text-center flex justify-center ${!showDecimalTime ? 'mb-10' : ''} dark:text-white`}>
        <div onClick={() => { setIsHourEditing(true); setTimeout(() => document.getElementById('hour-' + timer.id)?.focus()) }} className={`${isHourEditing ? 'hidden' : 'block'}`}>
          {formatTime(timer.time).hours.toString().padStart(2, '0')}
        </div>
        {isHourEditing && (
          <input
            id={`hour-${timer.id}`}
            type="number"
            max={99}
            min={0}
            defaultValue={formatTime(timer.time).hours.toString().padStart(2, '0')}
            onFocus={(e) => e.target.select()}
            onKeyDown={(e) => {
              if (e.key === 'Tab') {
                e.preventDefault();
                commitHourInput(e.currentTarget);
                if (e.shiftKey) {
                  setIsHourEditing(false);
                  setIsMinuteEditing(false);
                  setIsSecondEditing(false);
                  document.getElementById(`name-${timer.id}`)?.focus();
                  return;
                }
                setIsHourEditing(false);
                setIsMinuteEditing(true);
                setIsSecondEditing(false);
                focusTimeInput('minute');
              }
            }}
            onBlur={(e) => { commitHourInput(e.currentTarget); setIsHourEditing(false) }}
            className={`text-4xl font-mono text-center border-b dark:border-gray-700 focus:border-indigo-600 dark:focus:border-indigo-500 focus:outline-none w-[2ch] bg-transparent dark:text-white`}
          />
        )}
        :
        <div onClick={() => { setIsMinuteEditing(true); setTimeout(() => document.getElementById('minute-' + timer.id)?.focus()) }} className={`${isMinuteEditing ? 'hidden' : 'block'}`}>
          {(formatTime(timer.time).minutes % 60).toString().padStart(2, '0')}
        </div>
        {isMinuteEditing && (
          <input
            type="number"
            id={`minute-${timer.id}`}
            max={59}
            min={0}
            defaultValue={(formatTime(timer.time).minutes % 60).toString().padStart(2, '0')}
            onFocus={(e) => e.target.select()}
            onKeyDown={(e) => {
              if (e.key === 'Tab') {
                e.preventDefault();
                commitMinuteInput(e.currentTarget);
                if (e.shiftKey) {
                  setIsHourEditing(true);
                  setIsMinuteEditing(false);
                  setIsSecondEditing(false);
                  focusTimeInput('hour');
                  return;
                }
                setIsHourEditing(false);
                setIsMinuteEditing(false);
                setIsSecondEditing(true);
                focusTimeInput('second');
              }
            }}
            onBlur={(e) => { commitMinuteInput(e.currentTarget); setIsMinuteEditing(false) }}
            className={`text-4xl font-mono text-center border-b dark:border-gray-700 focus:border-indigo-600 dark:focus:border-indigo-500 focus:outline-none w-[2ch] bg-transparent dark:text-white`}
          />
        )}
        :
        <div onClick={() => { setIsSecondEditing(true); setTimeout(() => document.getElementById('second-' + timer.id)?.focus()) }} className={`${isSecondEditing ? 'hidden' : 'block'}`}>
          {(formatTime(timer.time).seconds % 60).toString().padStart(2, '0')}
        </div>
        {isSecondEditing && (
          <input
            type="number"
            id={`second-${timer.id}`}
            max={59}
            min={0}
            defaultValue={(formatTime(timer.time).seconds % 60).toString().padStart(2, '0')}
            onFocus={(e) => e.target.select()}
            onKeyDown={(e) => {
              if (e.key === 'Tab' && e.shiftKey) {
                e.preventDefault();
                commitSecondInput(e.currentTarget);
                setIsHourEditing(false);
                setIsMinuteEditing(true);
                setIsSecondEditing(false);
                focusTimeInput('minute');
              }
            }}
            onBlur={(e) => { commitSecondInput(e.currentTarget); setIsSecondEditing(false) }}
            className={`text-4xl font-mono text-center border-b dark:border-gray-700 focus:border-indigo-600 dark:focus:border-indigo-500 focus:outline-none w-[2ch] bg-transparent dark:text-white`}
          />
        )}
        {showMilliseconds && (
          <>
            :
            <div>
              {formatTime(timer.time).milliseconds.toString().padStart(3, '0')}
            </div>
          </>
        )}
      </div>
      {showDecimalTime && (
        <div className={`top-0 right-0 text-xl font-mono text-center flex justify-center mb-3 dark:text-white`}>
          <div>
            {convertToDecimalTime({ hour: formatTime(timer.time).hours, minutes: formatTime(timer.time).minutes % 60 }) + 'h'}
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={() => onToggle(timer.id)}
          onKeyDown={(e) => {
            if (e.key === 'Tab' && e.shiftKey) {
              e.preventDefault();
              setIsHourEditing(false);
              setIsMinuteEditing(false);
              setIsSecondEditing(true);
              focusTimeInput('second');
            }
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${timer.isRunning
            ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/70'
            : 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/70'
            }`}
        >
          {timer.isRunning ? (
            <>
              <Pause className="w-4 h-4" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Start
            </>
          )}
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => onReset(timer.id)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Reset timer"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              const element = document.getElementById(`timer-${timer.id}`);
              if (element) {
                element.classList.add('animate-out', 'fade-out-0', 'zoom-out', 'duration-300');
                setTimeout(() => onDelete(timer.id), 300);
              } else {
                onDelete(timer.id);
              }
            }}
            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors"
            title="Delete timer"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function DroppableDateGroup({ date, children }: { date: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: `date-${date}` });
  return (
    <div ref={setNodeRef} className={`mb-10 rounded-xl transition-all duration-150 ${isOver ? 'ring-2 ring-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
      {children}
    </div>
  );
}

function App() {
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
  const [pendingNameFocusTimerId, setPendingNameFocusTimerId] = useState<string | null>(null);

  const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null);
  const [activeDragTimer, setActiveDragTimer] = useState<Timer | null>(null);
  const originalTimersRef = useRef<Timer[]>([]);
  const widgetAnimationRef = useRef<number>();
  const timersRef = useRef<Timer[]>(timers);
  const isDarkModeRef = useRef<boolean>(isDarkMode);

  // Garder les références à jour
  useEffect(() => {
    timersRef.current = timers;
  }, [timers]);

  useEffect(() => {
    isDarkModeRef.current = isDarkMode;
  }, [isDarkMode]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('showByDate', JSON.stringify(showByDate));
  }, [showByDate]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const animationFrameRef = useRef<number>();

  const updateTimers = useCallback((timestamp: number) => {
    setTimers(prevTimers => {
      const updatedTimers = prevTimers.map(timer => {
        if (timer.isRunning && timer.startTime) {
          const elapsed = Date.now() - timer.startTime;
          return {
            ...timer,
            time: timer.time + elapsed,
            startTime: Date.now()
          };
        }
        return timer;
      });

      localStorage.setItem('timers', JSON.stringify(updatedTimers));
      return updatedTimers;
    });

    animationFrameRef.current = requestAnimationFrame(updateTimers);
  }, []);

  useEffect(() => {
    if (timers.some(timer => timer.isRunning)) {
      animationFrameRef.current = requestAnimationFrame(updateTimers);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [timers, updateTimers]);

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

  const deleteAllTimers = () => {
    timers.forEach(timer => {
      const element = document.getElementById(`timer-${timer.id}`);
      if (element) {
        element.classList.add('animate-out', 'fade-out-0', 'zoom-out', 'duration-300');
        setTimeout(() => { setTimers([]); localStorage.removeItem('timers') }, 300);
      } else {
        setTimers([]);
        localStorage.removeItem('timers');
      }
    });
  }

  const toggleTimer = (id: string) => {
    blurAllInputs();
    const timer = timers.find(timer => timer.id === id);
    if (isSimpleMode && timer && !timer.isRunning) {
      setTimers(prev => {
        const newTimers = prev.map(timer =>
          timer.isRunning ? {
            ...timer,
            isRunning: false,
            startTime: null
          } : timer
        );
        localStorage.setItem('timers', JSON.stringify(newTimers));
        return newTimers;
      });
    }
    const now = Date.now();
    setTimers(prev => {
      const newTimers = prev.map(timer =>
        timer.id === id ? {
          ...timer,
          isRunning: !timer.isRunning,
          startTime: !timer.isRunning ? now : null
        } : timer
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
    const atLeaseOneRunning = timers.some(timer => timer.isRunning);
    setTimers(prev => {
      const newTimers = prev.map(timer => ({
        ...timer,
        isRunning: !atLeaseOneRunning,
        startTime: !atLeaseOneRunning ? now : null
      }));
      localStorage.setItem('timers', JSON.stringify(newTimers));
      return newTimers;
    });
  };

  const toggleWidget = () => {
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture();
      setActiveWidgetId(null);
      if (widgetAnimationRef.current) {
        cancelAnimationFrame(widgetAnimationRef.current);
      }
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('Impossible d\'obtenir le contexte 2D');
      return;
    }

    const video = document.createElement('video');
    video.muted = true;
    video.srcObject = canvas.captureStream();
    video.onloadedmetadata = () => {
      video.play().then(() => {
        video.requestPictureInPicture().catch(error => {
          console.error('Erreur PiP:', error);
          setActiveWidgetId(null);
        });
      });
    };

    const drawTimer = () => {
      if (!ctx) return;

      const now = Date.now();

      // Récupérer le timer en cours depuis la référence
      const runningTimer = timersRef.current.find(t => t.isRunning);

      // Fond
      ctx.fillStyle = isDarkModeRef.current ? '#1e2939' : '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (!runningTimer) {
        // Afficher "No timer running" si aucun timer n'est actif
        ctx.font = '24px Arial';
        ctx.fillStyle = isDarkModeRef.current ? '#ffffff' : '#1e2939';
        ctx.textAlign = 'center';
        ctx.fillText('No timer running', canvas.width / 2, canvas.height / 2);
      } else {
        // Calculer le temps actuel
        const currentTime = runningTimer.time + (runningTimer.startTime ? now - runningTimer.startTime : 0);

        // Nom du timer
        ctx.font = '24px Arial';
        ctx.fillStyle = isDarkModeRef.current ? '#ffffff' : '#1e2939';
        ctx.textAlign = 'center';
        ctx.fillText(runningTimer.name, canvas.width / 2, 60);

        // Temps
        const { hours, minutes, seconds } = formatTime(currentTime);
        const timeString = `${hours.toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

        ctx.font = '36px monospace';
        ctx.fillStyle = isDarkModeRef.current ? '#ffffff' : '#1e2939';
        ctx.fillText(timeString, canvas.width / 2, 120);
      }

      widgetAnimationRef.current = requestAnimationFrame(drawTimer);
    };

    setActiveWidgetId('widget-active');
    drawTimer();

    // Nettoyer l'animation quand le PiP est fermé
    video.addEventListener('leavepictureinpicture', () => {
      if (widgetAnimationRef.current) {
        cancelAnimationFrame(widgetAnimationRef.current);
      }
      setActiveWidgetId(null);
    });
  };

  // Effet pour nettoyer le widget quand le composant est démonté
  useEffect(() => {
    return () => {
      if (widgetAnimationRef.current) {
        cancelAnimationFrame(widgetAnimationRef.current);
      }
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture();
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
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

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
    const original = originalTimersRef.current;
    if (original.length > 0) {
      setTimers(original);
      localStorage.setItem('timers', JSON.stringify(original));
      originalTimersRef.current = [];
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragTimer(null);
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
    const totalms = timers.reduce((acc, timer) => acc + timer.time, 0);
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
      if (event.ctrlKey && event.key === 'v' && document.activeElement?.tagName !== 'INPUT') {
        handlePaste();
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
    const timersWithDecimalTime = timers.map(timer => ({
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
          isChecked: typeof timer.isChecked === 'boolean' ? timer.isChecked : false
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
    const totalms = timers.reduce((acc, timer) => acc + timer.time, 0);
    return formatTime(totalms).hours.toString().padStart(2, '0') + ':' + (formatTime(totalms).minutes % 60).toString().padStart(2, '0') + ':' + (formatTime(totalms).seconds % 60).toString().padStart(2, '0');
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900" onContextMenu={handleContextMenu} onDragOver={handleNativeDragOver} onDrop={handleDrop}>
      <FloatingButton
        triggerContent={
          <button className="flex items-center justify-center h-14 w-14 rounded-full bg-slate-300 dark:bg-slate-700 text-gray-600 dark:text-white/80 z-100">
            <ArrowBigUpDash />
          </button>
        }>
        {timers.length > 0 && (
          <FloatingButtonItem key="deleteAll">
            <ConfirmDeleteButton onDelete={deleteAllTimers} rounded />
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
            onClick={() => addTimer({})}
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
        showWidget={activeWidgetId !== null}
        onDeleteAll={deleteAllTimers}
        onToggleAll={toggleAllTimers}
        onAddTimer={() => addTimer({ name: 'Timer ' + (timers.length + 1) })}
        onToggleSimpleMode={() => setIsSimpleMode(prev => !prev)}
        onToggleCheckingMode={() => setIsCheckingMode(prev => !prev)}
        onToggleDecimalTime={() => setShowDecimalTime(prev => !prev)}
        onToggleMilliseconds={() => setShowMilliseconds(prev => !prev)}
        onToggleDarkMode={() => setIsDarkMode(prev => !prev)}
        onDownloadJSON={downloadJSON}
        getTotalTime={getTotalTime}
        onImportJSON={handleFileUpload}
        onToggleByDate={() => setShowByDate(prev => !prev)} // New method
        onToggleWidget={() => toggleWidget()} // New method
      />

      <div className="max-w-12xl mx-auto p-4 sm:p-8 ">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          {showByDate ? (
            Object.entries(groupTimersByDate(timers)).map(([date, timers]) => {
              const isDayFullyChecked = timers.length > 0 && timers.every(timer => timer.isChecked);
              return (
                <DroppableDateGroup key={date} date={date}>
                  <div className="flex items-center gap-4 text-gray-800 dark:text-white mb-4">
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
                      title="Ajouter un timer à cette date"
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
                            formatTime={formatTime}
                            showMilliseconds={showMilliseconds}
                            showDecimalTime={showDecimalTime}
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
                      formatTime={formatTime}
                      showMilliseconds={showMilliseconds}
                      showDecimalTime={showDecimalTime}
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
      </div>
    </div>
  );
}

export default App;