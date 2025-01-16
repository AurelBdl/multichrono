import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, RefreshCw, Trash2, Plus, Timer, GripVertical, Clock } from 'lucide-react';
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
}

const blurAllInputs = () => {
  const inputs = document.querySelectorAll('input');
  inputs.forEach(input => {
    input.blur();
  });
};

function SortableTimer({ timer, onToggle, onReset, onDelete, onNameChange, onHourChange, onMinuteChange, onSecondChange, formatTime, onRender, showMilliseconds }: SortableTimerProps) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg shadow-md p-4 sm:p-6 space-y-4 ${!timer.hasBeenRendered ? 'animate-in fade-in-0 duration-300 zoom-in' : ''}`}
    >
      <div className="flex items-center gap-2 touch-none">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded touch-none"
        >
          <GripVertical className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={timer.name}
          onChange={(e) => onNameChange(timer.id, e.target.value)}
          className="flex-1 text-lg font-semibold bg-transparent border-b border-gray-200 focus:border-indigo-600 focus:outline-none pb-1"
        />
      </div>
      <div className="text-4xl font-mono py-4 text-center flex justify-center">
        <div onClick={() => !timer.isRunning && setIsHourEditing(true)} className={`${isHourEditing ? 'hidden' : 'block'}`}>
          {formatTime(timer.time).hours.toString().padStart(2, '0')}
        </div>
        {isHourEditing && (
          <input
            type="number"
            max={99}
            min={0}
            defaultValue={formatTime(timer.time).hours.toString().padStart(2, '0')}
            onBlur={(e) => { onHourChange(timer.id, e.target.value ? parseInt(e.target.value) : 0, parseInt(e.target.defaultValue)); setIsHourEditing(false) }}
            className={`text-4xl font-mono text-center border-b focus:border-indigo-600 focus:outline-none w-[2ch]`}
          />
        )}
        :
        <div onClick={() => !timer.isRunning && setIsMinuteEditing(true)} className={`${isMinuteEditing ? 'hidden' : 'block'}`}>
          {(formatTime(timer.time).minutes % 60).toString().padStart(2, '0')}
        </div>
        {isMinuteEditing && (
          <input
            type="number"
            max={59}
            min={0}
            defaultValue={(formatTime(timer.time).minutes % 60).toString().padStart(2, '0')}
            onBlur={(e) => { onMinuteChange(timer.id, e.target.value ? parseInt(e.target.value) : 0, parseInt(e.target.defaultValue)); setIsMinuteEditing(false) }}
            className={`text-4xl font-mono text-center border-b focus:border-indigo-600 focus:outline-none w-[2ch]`}
          />
        )}
        :
        <div onClick={() => !timer.isRunning && setIsSecondEditing(true)} className={`${isSecondEditing ? 'hidden' : 'block'}`}>
          {(formatTime(timer.time).seconds % 60).toString().padStart(2, '0')}
        </div>
        {isSecondEditing && (
          <input
            type="number"
            max={59}
            min={0}
            defaultValue={(formatTime(timer.time).seconds % 60).toString().padStart(2, '0')}
            onBlur={(e) => { onSecondChange(timer.id, e.target.value ? parseInt(e.target.value) : 0, parseInt(e.target.defaultValue)); setIsSecondEditing(false) }}
            className={`text-4xl font-mono text-center border-b focus:border-indigo-600 focus:outline-none w-[2ch]`}
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
      <div className="flex justify-between">
        <button
          onClick={() => onToggle(timer.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${timer.isRunning
            ? 'bg-red-100 text-red-600 hover:bg-red-200'
            : 'bg-green-100 text-green-600 hover:bg-green-200'
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
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
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
            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
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
    if (!saved) return [];

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

  const setTimerIsRendered = (id: string) => {
    setTimers(prev => {
      const newTimers = prev.map(timer =>
        timer.id === id ? { ...timer, hasBeenRendered: true } : timer
      );
      return newTimers;
    });
  };

  const addTimer = () => {
    const newTimer: Timer = {
      id: crypto.randomUUID(),
      name: 'Timer ' + (timers.length + 1),
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
        setTimeout(() => {setTimers([]); localStorage.removeItem('timers')}, 300);
      } else {
        setTimers([]);
        localStorage.removeItem('timers');
      }
    });
    // setTimeout(() => setTimers([]), 300);
    // setTimers([]);
  }

  const toggleTimer = (id: string) => {
    blurAllInputs();
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
    console.log(hour);
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
    //`${hours.toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}${showMilliseconds ? `.${milliseconds.toString().padStart(3, '0')}` : ''}`;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-12xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8">
          <div className="flex items-center gap-3 mb-4 sm:mb-0">
            <Timer className="w-8 h-8 text-indigo-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Multi Timer</h1>
          </div>
          {/* On multiple rows on mobile */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowMilliseconds(prev => !prev)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${showMilliseconds
                ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              title="Toggle milliseconds display"
            >
              <Clock className="w-5 h-5 hidden sm:inline" />
              <span>ms</span>
            </button>
            {timers.length > 0 && (
              <ConfirmDeleteButton onDelete={deleteAllTimers} />
            )}
            {timers.length > 0 ? (
              timers.find(elem => elem.isRunning) ? (
                <button
                  onClick={toggleAllTimers}
                  className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Pause className="w-6 h-6" />
                  <span className="hidden sm:inline">Pause All</span>
                </button>
              ) : (
                <button
                  onClick={toggleAllTimers}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Play className="w-6 h-6" />
                  <span className="hidden sm:inline">Start All</span>
                </button>
              )
            ) : null}
            <button
              onClick={addTimer}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-6 h-6" />
              <span className="hidden sm:inline">Add Timer</span>
            </button>
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
                <div key={timer.id} id={`timer-${timer.id}`}>
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
                  />
                </div>
              ))}
            </SortableContext>
          </div>
        </DndContext>

        {timers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No timers yet. Click "Add Timer" to create one!
          </div>
        )}
      </div>
    </div>
  );
}

export default App;