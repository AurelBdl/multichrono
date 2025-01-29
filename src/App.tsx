import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RefreshCw, Trash2, Plus, Timer, GripVertical, Clock, Copy, Square, Hourglass, Sun, Moon } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ConfirmDeleteButton from './ui/ConfirmDeleteButton';

interface Timer {
  id: string;
  name: string;
  time: number;
  isRunning: boolean;
  startTime: number | null;
  hasBeenRendered?: boolean;
}

interface SortableTimerProps {
  timer: Timer;
  onToggle: (id: string) => void;
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
}

const blurAllInputs = () => {
  const inputs = document.querySelectorAll('input');
  inputs.forEach(input => {
    input.blur();
  });
};

function SortableTimer({ timer, onToggle, onReset, onDelete, onNameChange, onHourChange, onMinuteChange, onSecondChange, formatTime, onRender, showMilliseconds, showDecimalTime }: SortableTimerProps) {
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
      className={`bg-white dark:bg-gray-800 items-center rounded-lg shadow-md p-4 sm:p-6 ${!timer.hasBeenRendered ? 'animate-in fade-in-0 duration-300 zoom-in' : ''}`}
    >
      <div className="flex items-center gap-2 mb-10">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded touch-none"
        >
          <GripVertical className="w-5 h-5 text-gray-400 dark:text-gray-500" />
        </div>
        <input
          type="text"
          value={timer.name}
          onFocus={(e) => e.target.select()}
          onChange={(e) => onNameChange(timer.id, e.target.value)}
          className="flex-1 text-lg font-semibold bg-transparent border-b border-gray-200 dark:border-gray-700 focus:border-indigo-600 dark:focus:border-indigo-500 focus:outline-none pb-1 dark:text-white"
        />
      </div>
      <div className={`text-4xl font-mono text-center flex justify-center ${!showDecimalTime ? 'mb-10' : ''} dark:text-white`}>
        <div onClick={() => { if (!timer.isRunning) setIsHourEditing(true); setTimeout(() => document.getElementById('hour-' + timer.id)?.focus()) }} className={`${isHourEditing ? 'hidden' : 'block'}`}>
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
            onBlur={(e) => { onHourChange(timer.id, e.target.value ? parseInt(e.target.value) : 0, parseInt(e.target.defaultValue)); setIsHourEditing(false) }}
            className={`text-4xl font-mono text-center border-b dark:border-gray-700 focus:border-indigo-600 dark:focus:border-indigo-500 focus:outline-none w-[2ch] bg-transparent dark:text-white`}
          />
        )}
        :
        <div onClick={() => { if (!timer.isRunning) setIsMinuteEditing(true); setTimeout(() => document.getElementById('minute-' + timer.id)?.focus()) }} className={`${isMinuteEditing ? 'hidden' : 'block'}`}>
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
            onBlur={(e) => { onMinuteChange(timer.id, e.target.value ? parseInt(e.target.value) : 0, parseInt(e.target.defaultValue)); setIsMinuteEditing(false) }}
            className={`text-4xl font-mono text-center border-b dark:border-gray-700 focus:border-indigo-600 dark:focus:border-indigo-500 focus:outline-none w-[2ch] bg-transparent dark:text-white`}
          />
        )}
        :
        <div onClick={() => { if (!timer.isRunning) setIsSecondEditing(true); setTimeout(() => document.getElementById('second-' + timer.id)?.focus()) }} className={`${isSecondEditing ? 'hidden' : 'block'}`}>
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
            onBlur={(e) => { onSecondChange(timer.id, e.target.value ? parseInt(e.target.value) : 0, parseInt(e.target.defaultValue)); setIsSecondEditing(false) }}
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
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
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
          hasBeenRendered: false
        }
      ];
    }
    const parsedTimers: Timer[] = JSON.parse(saved);
    return parsedTimers.map(timer => {
      if (timer.isRunning && timer.startTime) {
        const now = Date.now();
        const elapsedSinceLastSave = now - timer.startTime;
        return {
          ...timer,
          time: timer.time + elapsedSinceLastSave,
          startTime: now
        };
      }
      return timer;
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
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

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

  const setTimerIsRendered = (id: string) => {
    setTimers(prev => {
      const newTimers = prev.map(timer =>
        timer.id === id ? { ...timer, hasBeenRendered: true } : timer
      );
      return newTimers;
    });
  };

  const addTimer = ({ name = 'Timer ' + (timers.length + 1) }: { name: string }) => {
    const newTimer: Timer = {
      id: crypto.randomUUID(),
      name: name,
      time: 0,
      isRunning: false,
      startTime: null,
      hasBeenRendered: false
    };
    setTimers(prev => {
      const newTimers = [...prev, newTimer];
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setTimers((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newTimers = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem('timers', JSON.stringify(newTimers));
        return newTimers;
      });
    }
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

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 sm:p-8" onContextMenu={handleContextMenu}>
      <div id="context-menu" className="hidden fixed bg-white dark:bg-gray-800 shadow-md rounded-lg z-50">
        <button onClick={handlePaste} className="block px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Paste</button>
      </div>
      <div className="max-w-12xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8">
          <div className="flex items-center gap-3 mb-4 sm:mb-0">
            <Timer className="w-8 h-8 text-indigo-600 dark:text-indigo-500" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Multi Timer</h1>
            {timers.length > 1 && <h1 className="text-2xl sm:text-3xl text-gray-800 dark:text-white">{getTotalTime()}</h1>}
          </div>
          <div className="flex items-center gap-4">
            {timers.length > 0 && (
              <ConfirmDeleteButton onDelete={deleteAllTimers} />
            )}
            {timers.length > 0 && !isSimpleMode ? (
              timers.find(elem => elem.isRunning) ? (
                <button
                  onClick={toggleAllTimers}
                  className="flex items-center gap-2 bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Pause className="w-6 h-6" />
                  <span className="hidden sm:inline">Pause All</span>
                </button>
              ) : (
                <button
                  onClick={toggleAllTimers}
                  className="flex items-center gap-2 bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Play className="w-6 h-6" />
                  <span className="hidden sm:inline">Start All</span>
                </button>
              )
            ) : null}
            <button
              // Don't pass any params
              onClick={addTimer}
              className="flex items-center gap-2 bg-indigo-600 dark:bg-indigo-500 text-white p-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
            >
              <Plus className="w-6 h-6" />
              <span className="hidden sm:inline">Add Timer</span>
            </button>
            <button
              onClick={() => setIsSimpleMode(prev => !prev)}
              className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${!isSimpleMode
                ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/70'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              title={isSimpleMode ? "Switch to multi mode" : "Switch to simple mode"}
            >
              {!isSimpleMode ? <Square className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
            </button>
            <button
              onClick={() => setShowDecimalTime((prev: boolean) => !prev)}
              className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${showDecimalTime
                ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/70'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              title="Toggle decimal time format"
            >
              <Hourglass className="w-6 h-6" />
            </button>
            <button
              onClick={() => setShowMilliseconds((prev: boolean) => !prev)}
              className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${showMilliseconds
                ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/70'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              title="Toggle milliseconds display"
            >
              <Clock className="w-6 h-6 hidden sm:inline" />
              <span>ms</span>
            </button>
            {/* <button
              onClick={() => setIsDarkMode(prev => !prev)}
              className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${isDarkMode
                ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/70'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              title="Toggle dark mode"
            >
              {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </button> */}
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <SortableContext
              items={timers}
              strategy={rectSortingStrategy}
            >
              {timers.map((timer) => (
                <div key={timer.id} id={`timer-${timer.id}`} className="timer-container">
                  <SortableTimer
                    onRender={() => setTimerIsRendered(timer.id)}
                    timer={timer}
                    onToggle={toggleTimer}
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