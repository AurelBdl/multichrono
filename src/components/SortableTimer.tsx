import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Play, Pause, RefreshCw, Trash2, GripVertical, Check, Goal } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface Timer {
  id: string;
  name: string;
  time: number;
  isRunning: boolean;
  startTime: number | null;
  creationDate?: Date;
  isChecked: boolean;
  hasBeenRendered?: boolean;
  goalTime?: number | null;
}

export interface SortableTimerProps {
  timer: Timer;
  onToggle: (id: string) => void;
  onToggleChecking: (id: string) => void;
  onReset: (id: string) => void;
  onDelete: (id: string) => void;
  onNameChange: (id: string, name: string) => void;
  onHourChange: (id: string, hour: number, prevHour: number) => void;
  onMinuteChange: (id: string, minute: number, prevMinute: number) => void;
  onSecondChange: (id: string, second: number, prevSecond: number) => void;
  onGoalChange: (id: string, goalMs: number | null) => void;
  formatTime: (ms: number) => { hours: number; minutes: number; seconds: number; milliseconds: number };
  onRender?: () => void;
  showMilliseconds: boolean;
  showDecimalTime: boolean;
  showGoals: boolean;
  isCheckingMode: boolean;
  shouldAutoFocusName?: boolean;
  onNameFocusHandled?: () => void;
}

interface GoalModalProps {
  timerName: string;
  initialHours: number;
  initialMinutes: number;
  initialSeconds: number;
  hasExistingGoal: boolean;
  onConfirm: (ms: number | null) => void;
  onClose: () => void;
}

const GoalModal = React.memo(function GoalModal({
  timerName,
  initialHours,
  initialMinutes,
  initialSeconds,
  hasExistingGoal,
  onConfirm,
  onClose,
}: GoalModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [hours, setHours] = useState(initialHours);
  const [minutes, setMinutes] = useState(initialMinutes);
  const [seconds, setSeconds] = useState(initialSeconds);

  const onConfirmRef = useRef(onConfirm);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onConfirmRef.current = onConfirm; }, [onConfirm]);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  const close = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => onCloseRef.current(), 150);
  }, []);

  const confirm = useCallback(() => {
    const ms = (hours * 3600 + minutes * 60 + seconds) * 1000;
    if (ms > 0) {
      if (Notification.permission === 'default') Notification.requestPermission();
      onConfirmRef.current(ms);
    } else {
      onConfirmRef.current(null);
    }
    close();
  }, [hours, minutes, seconds, close]);

  const remove = useCallback(() => {
    onConfirmRef.current(null);
    close();
  }, [close]);

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${isClosing ? 'animate-out fade-out-0 duration-150' : 'animate-in fade-in-0 duration-200'}`}
      onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      <div
        className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 w-80 ${isClosing ? 'animate-out zoom-out-95 duration-150' : 'animate-in zoom-in-95 duration-200'}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <Goal className="w-4 h-4 text-indigo-500" />
            Time goal
            {timerName && <span className="text-gray-400 dark:text-gray-500 font-normal truncate max-w-28">— {timerName}</span>}
          </h3>
          <button onClick={close} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors text-lg leading-none">✕</button>
        </div>
        <div className="flex items-end gap-2 mb-6">
          <div className="flex flex-col items-center flex-1">
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Hours</label>
            <input
              type="number" min={0} max={99} value={hours}
              onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
              onFocus={(e) => e.target.select()}
              className="w-full text-center text-2xl font-mono border border-gray-200 dark:border-gray-600 rounded-xl py-2 bg-gray-50 dark:bg-gray-700/60 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <span className="text-gray-400 dark:text-gray-500 font-bold text-2xl pb-2">:</span>
          <div className="flex flex-col items-center flex-1">
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Minutes</label>
            <input
              type="number" min={0} max={59} value={minutes}
              onChange={(e) => setMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
              onFocus={(e) => e.target.select()}
              className="w-full text-center text-2xl font-mono border border-gray-200 dark:border-gray-600 rounded-xl py-2 bg-gray-50 dark:bg-gray-700/60 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <span className="text-gray-400 dark:text-gray-500 font-bold text-2xl pb-2">:</span>
          <div className="flex flex-col items-center flex-1">
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Seconds</label>
            <input
              type="number" min={0} max={59} value={seconds}
              onChange={(e) => setSeconds(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
              onFocus={(e) => e.target.select()}
              className="w-full text-center text-2xl font-mono border border-gray-200 dark:border-gray-600 rounded-xl py-2 bg-gray-50 dark:bg-gray-700/60 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={confirm}
            className="flex items-center justify-center gap-2 flex-1 px-4 py-2.5 rounded-xl transition-colors bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 font-medium"
          >
            Confirm
          </button>
          {hasExistingGoal && (
            <button
              onClick={remove}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-colors bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/70 font-medium"
            >
              <Trash2 className="w-4 h-4" />
              Remove
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
});

function SortableTimer({
  timer,
  onToggle,
  onToggleChecking,
  onReset,
  onDelete,
  onNameChange,
  onHourChange,
  onMinuteChange,
  onSecondChange,
  onGoalChange,
  formatTime,
  onRender,
  showMilliseconds,
  showDecimalTime,
  showGoals,
  isCheckingMode,
  shouldAutoFocusName,
  onNameFocusHandled,
}: SortableTimerProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: timer.id });
  const [isHovered, setIsHovered] = useState(false);
  const [isHourEditing, setIsHourEditing] = useState(false);
  const [isMinuteEditing, setIsMinuteEditing] = useState(false);
  const [isSecondEditing, setIsSecondEditing] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalInitial, setGoalInitial] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const hasNotifiedRef = useRef(false);
  const onGoalChangeRef = useRef(onGoalChange);
  useEffect(() => { onGoalChangeRef.current = onGoalChange; }, [onGoalChange]);

  // When running, displayTime updates every frame via local rAF.
  // When stopped, effectiveTime falls back directly to timer.time (no setState needed).
  const [displayTime, setDisplayTime] = useState(0);
  useEffect(() => {
    if (!timer.isRunning || !timer.startTime) return;
    const baseTime = timer.time;
    const startTime = timer.startTime;
    let rafId: number;
    const tick = () => {
      setDisplayTime(baseTime + (Date.now() - startTime));
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [timer.isRunning, timer.startTime, timer.time]);

  const effectiveTime = timer.isRunning ? displayTime : timer.time;

  const stableConfirm = useCallback((ms: number | null) => {
    onGoalChangeRef.current(timer.id, ms);
  }, [timer.id]);

  const stableClose = useCallback(() => {
    setShowGoalModal(false);
  }, []);

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

  const formatGoalDisplay = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
    if (m > 0) return `${m}m ${s.toString().padStart(2, '0')}s`;
    return `${s}s`;
  };

  useEffect(() => {
    if (!timer.goalTime) return;
    // Compute live time fresh from props to avoid triggering on stale displayTime
    // (e.g. right after a reset + restart, displayTime may still hold the old value)
    const liveTime = timer.isRunning && timer.startTime
      ? timer.time + (Date.now() - timer.startTime)
      : timer.time;
    if (liveTime >= timer.goalTime && !hasNotifiedRef.current) {
      hasNotifiedRef.current = true;
      if (Notification.permission === 'granted') {
        new Notification(`🎯 Goal reached: ${timer.name}`, {
          body: `The timer has reached its goal of ${formatGoalDisplay(timer.goalTime)}.`,
        });
      }
    }
    if (liveTime < timer.goalTime) {
      hasNotifiedRef.current = false;
    }
  }, [effectiveTime, timer.goalTime, timer.name, timer.isRunning, timer.startTime, timer.time]);

  const openGoalModal = () => {
    if (timer.goalTime) {
      const totalSeconds = Math.floor(timer.goalTime / 1000);
      setGoalInitial({
        hours: Math.floor(totalSeconds / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        seconds: totalSeconds % 60,
      });
    } else {
      setGoalInitial({ hours: 0, minutes: 0, seconds: 0 });
    }
    setShowGoalModal(true);
  };

  const goalProgress = timer.goalTime ? Math.min(100, (effectiveTime / timer.goalTime) * 100) : 0;
  const goalReached = timer.goalTime ? effectiveTime >= timer.goalTime : false;

  const convertToDecimalTime = ({ hour, minutes }: { hour: number; minutes: number }) => {
    if (typeof hour !== 'number' || typeof minutes !== 'number') {
      throw new Error('Les propriétés hour et minutes doivent être des nombres.');
    }

    let decimalTime = hour + minutes / 60;
    decimalTime = Math.round(decimalTime * 20) / 20;

    return decimalTime;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative bg-white dark:bg-gray-800 items-center rounded-lg shadow-md p-4 sm:p-6 ${timer.isChecked ? 'ring-2 ring-green-300 dark:ring-green-700 bg-green-50/50 dark:bg-green-900/20' : ''} ${!timer.hasBeenRendered ? 'animate-in fade-in-0 duration-300 zoom-in' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-1 mb-10">
        {isCheckingMode && (
          <div className={`shrink-0 overflow-hidden transition-all duration-200 ease-out ${isHovered || timer.isChecked ? 'w-5 opacity-100' : 'w-0 opacity-0 -ml-2'}`}>
            <label className="flex items-center cursor-pointer select-none">
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
          </div>
        )}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1"
          title="Drag timer"
        >
          <GripVertical className="w-5 h-5 text-gray-400 dark:text-gray-500" />
        </div>
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
          {formatTime(effectiveTime).hours.toString().padStart(2, '0')}
        </div>
        {isHourEditing && (
          <input
            id={`hour-${timer.id}`}
            type="number"
            max={99}
            min={0}
            defaultValue={formatTime(effectiveTime).hours.toString().padStart(2, '0')}
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
            onBlur={(e) => { commitHourInput(e.currentTarget); setIsHourEditing(false); }}
            className={`text-4xl font-mono text-center border-b dark:border-gray-700 focus:border-indigo-600 dark:focus:border-indigo-500 focus:outline-none w-[2ch] bg-transparent dark:text-white`}
          />
        )}
        :
        <div onClick={() => { setIsMinuteEditing(true); setTimeout(() => document.getElementById('minute-' + timer.id)?.focus()) }} className={`${isMinuteEditing ? 'hidden' : 'block'}`}>
          {(formatTime(effectiveTime).minutes % 60).toString().padStart(2, '0')}
        </div>
        {isMinuteEditing && (
          <input
            type="number"
            id={`minute-${timer.id}`}
            max={59}
            min={0}
            defaultValue={(formatTime(effectiveTime).minutes % 60).toString().padStart(2, '0')}
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
            onBlur={(e) => { commitMinuteInput(e.currentTarget); setIsMinuteEditing(false); }}
            className={`text-4xl font-mono text-center border-b dark:border-gray-700 focus:border-indigo-600 dark:focus:border-indigo-500 focus:outline-none w-[2ch] bg-transparent dark:text-white`}
          />
        )}
        :
        <div onClick={() => { setIsSecondEditing(true); setTimeout(() => document.getElementById('second-' + timer.id)?.focus()) }} className={`${isSecondEditing ? 'hidden' : 'block'}`}>
          {(formatTime(effectiveTime).seconds % 60).toString().padStart(2, '0')}
        </div>
        {isSecondEditing && (
          <input
            type="number"
            id={`second-${timer.id}`}
            max={59}
            min={0}
            defaultValue={(formatTime(effectiveTime).seconds % 60).toString().padStart(2, '0')}
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
            onBlur={(e) => { commitSecondInput(e.currentTarget); setIsSecondEditing(false); }}
            className={`text-4xl font-mono text-center border-b dark:border-gray-700 focus:border-indigo-600 dark:focus:border-indigo-500 focus:outline-none w-[2ch] bg-transparent dark:text-white`}
          />
        )}
        {showMilliseconds && (
          <>
            :
            <div>
              {formatTime(effectiveTime).milliseconds.toString().padStart(3, '0')}
            </div>
          </>
        )}
      </div>
      {showDecimalTime && (
        <div className={`top-0 right-0 text-xl font-mono text-center flex justify-center mb-3 dark:text-white`}>
          <div>
            {convertToDecimalTime({ hour: formatTime(effectiveTime).hours, minutes: formatTime(effectiveTime).minutes % 60 }) + 'h'}
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
          {showGoals && (
            <>
              <button
                onClick={openGoalModal}
                className={`p-2 rounded-lg transition-colors ${timer.goalTime
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                title={timer.goalTime ? `Goal: ${formatGoalDisplay(timer.goalTime)}` : 'Set a time goal'}
              >
                <Goal className="w-5 h-5" />
              </button>
              {showGoalModal && (
                <GoalModal
                  timerName={timer.name}
                  initialHours={goalInitial.hours}
                  initialMinutes={goalInitial.minutes}
                  initialSeconds={goalInitial.seconds}
                  hasExistingGoal={!!timer.goalTime}
                  onConfirm={stableConfirm}
                  onClose={stableClose}
                />
              )}
            </>
          )}
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

      {showGoals && timer.goalTime && (
        <div className="absolute bottom-3 left-4 right-4 sm:left-6 sm:right-6 h-1.5 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
          <div
            className={`h-full w-full rounded-full ${goalReached ? 'bg-green-500 dark:bg-green-400' : 'bg-indigo-500 dark:bg-indigo-400'}`}
            style={{ transform: `scaleX(${goalProgress / 100})`, transformOrigin: 'left', willChange: 'transform' }}
          />
        </div>
      )}
    </div>
  );
}

export default React.memo(SortableTimer, (prev, next) =>
  prev.timer.id === next.timer.id &&
  prev.timer.isRunning === next.timer.isRunning &&
  prev.timer.startTime === next.timer.startTime &&
  prev.timer.time === next.timer.time &&
  prev.timer.name === next.timer.name &&
  prev.timer.isChecked === next.timer.isChecked &&
  prev.timer.goalTime === next.timer.goalTime &&
  prev.timer.hasBeenRendered === next.timer.hasBeenRendered &&
  prev.showMilliseconds === next.showMilliseconds &&
  prev.showDecimalTime === next.showDecimalTime &&
  prev.showGoals === next.showGoals &&
  prev.isCheckingMode === next.isCheckingMode &&
  prev.shouldAutoFocusName === next.shouldAutoFocusName
);
