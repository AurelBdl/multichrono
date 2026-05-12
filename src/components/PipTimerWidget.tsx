import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';
import { Timer } from './SortableTimer';

interface PipTimerWidgetProps {
  timers: Timer[];
  onToggle: (id: string) => void;
  onNameChange: (id: string, name: string) => void;
  onHourChange: (id: string, hour: number, prevHour: number) => void;
  onMinuteChange: (id: string, minute: number, prevMinute: number) => void;
  onSecondChange: (id: string, second: number, prevSecond: number) => void;
  formatTime: (ms: number) => { hours: number; minutes: number; seconds: number; milliseconds: number };
  showByDate: boolean;
  showDecimalTime: boolean;
  showGoals: boolean;
}

export default function PipTimerWidget({ timers, onToggle, onNameChange, onHourChange, onMinuteChange, onSecondChange, formatTime, showByDate, showDecimalTime, showGoals }: PipTimerWidgetProps) {
  const [selectedIndex, setSelectedIndex] = useState(() => {
    const runningIdx = timers.findIndex(t => t.isRunning);
    return runningIdx >= 0 ? runningIdx : 0;
  });

  const [isHourEditing, setIsHourEditing] = useState(false);
  const [isMinuteEditing, setIsMinuteEditing] = useState(false);
  const [isSecondEditing, setIsSecondEditing] = useState(false);
  const [containerHeight, setContainerHeight] = useState(300);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track container height
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setContainerHeight(entry.contentRect.height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Keep selectedIndex in bounds
  useEffect(() => {
    if (timers.length > 0 && selectedIndex >= timers.length) {
      setSelectedIndex(timers.length - 1);
    }
  }, [timers.length, selectedIndex]);

  // Auto-select running timer when one starts
  useEffect(() => {
    const runningIdx = timers.findIndex(t => t.isRunning);
    if (runningIdx >= 0) {
      setSelectedIndex(runningIdx);
    }
  }, [timers.map(t => t.isRunning).join(',')]);

  const timer = timers[selectedIndex];

  // Live time display via rAF
  const [displayTime, setDisplayTime] = useState(0);
  useEffect(() => {
    if (!timer) return;
    if (!timer.isRunning || !timer.startTime) {
      setDisplayTime(timer.time);
      return;
    }
    let rafId: number;
    const tick = () => {
      setDisplayTime(timer.time + (Date.now() - timer.startTime!));
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [timer?.id, timer?.isRunning, timer?.startTime, timer?.time]);

  if (!timer) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 text-sm">
        No timers
      </div>
    );
  }

  const { hours, minutes, seconds } = formatTime(displayTime);
  const displayMinutes = minutes % 60;
  const displaySeconds = seconds % 60;

  const parseInputValue = (value: string, fallbackValue: string) => {
    const parsedValue = Number.parseInt(value, 10);
    if (!Number.isNaN(parsedValue)) return parsedValue;
    const parsedFallback = Number.parseInt(fallbackValue, 10);
    return Number.isNaN(parsedFallback) ? 0 : parsedFallback;
  };

  const commitHour = (input: HTMLInputElement) => {
    onHourChange(timer.id, parseInputValue(input.value, input.defaultValue), Number.parseInt(input.defaultValue, 10));
  };
  const commitMinute = (input: HTMLInputElement) => {
    onMinuteChange(timer.id, parseInputValue(input.value, input.defaultValue), Number.parseInt(input.defaultValue, 10));
  };
  const commitSecond = (input: HTMLInputElement) => {
    onSecondChange(timer.id, parseInputValue(input.value, input.defaultValue), Number.parseInt(input.defaultValue, 10));
  };

  const findEl = (id: string) => {
    const ownerDoc = containerRef.current?.ownerDocument ?? document;
    return ownerDoc.getElementById(id);
  };

  const focusTimeInput = (unit: string) => {
    setTimeout(() => {
      findEl(`pip-${unit}-${timer.id}`)?.focus();
    });
  };

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-gray-100 dark:bg-gray-900 select-none" style={{ padding: 'clamp(8px, 2vw, 16px)' }}>

      {/* Center content: name + time + controls */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-0">
        {/* Timer name */}
        <input
          id={`pip-name-${timer.id}`}
          type="text"
          value={timer.name}
          onChange={(e) => onNameChange(timer.id, e.target.value)}
          onFocus={(e) => e.target.select()}
          onKeyDown={(e) => {
            if (e.key === 'Tab' && !e.shiftKey) {
              e.preventDefault();
              setIsHourEditing(true);
              setIsMinuteEditing(false);
              setIsSecondEditing(false);
              focusTimeInput('hour');
            }
          }}
          className="w-full text-center font-semibold bg-transparent border-b border-gray-200 dark:border-gray-700 focus:border-indigo-600 dark:focus:border-indigo-500 focus:outline-none pb-1 dark:text-white mx-2 text-ellipsis overflow-hidden"
          style={{ fontSize: 'clamp(12px, 4.5vw, 20px)', marginBottom: 'clamp(6px, 1.5vh, 12px)' }}
        />

        {/* Editable time display */}
        <div className="font-mono text-center dark:text-white tabular-nums tracking-tight flex justify-center" style={{ fontSize: 'clamp(24px, 13vw, 64px)', marginBottom: showDecimalTime ? '0px' : 'clamp(8px, 2vh, 16px)' }}>
        {/* Hours */}
        <div onClick={() => { setIsHourEditing(true); setIsMinuteEditing(false); setIsSecondEditing(false); setTimeout(() => findEl(`pip-hour-${timer.id}`)?.focus()); }} className={isHourEditing ? 'hidden' : 'block cursor-text'}>
          {hours.toString().padStart(2, '0')}
        </div>
        {isHourEditing && (
          <input
            id={`pip-hour-${timer.id}`}
            type="number"
            min={0}
            defaultValue={hours.toString().padStart(2, '0')}
            onFocus={(e) => e.target.select()}
            onKeyDown={(e) => {
              if (e.key === 'Tab') {
                e.preventDefault();
                commitHour(e.currentTarget);
                setIsHourEditing(false);
                if (e.shiftKey) {
                  setTimeout(() => findEl(`pip-name-${timer.id}`)?.focus());
                  return;
                }
                setIsMinuteEditing(true);
                focusTimeInput('minute');
              }
            }}
            onBlur={(e) => { commitHour(e.currentTarget); setIsHourEditing(false); }}
            style={{ width: `${Math.max(2, hours.toString().length)}ch`, fontSize: 'inherit' }}
            className="font-mono text-center border-b dark:border-gray-700 focus:border-indigo-600 dark:focus:border-indigo-500 focus:outline-none bg-transparent dark:text-white"
          />
        )}
        :
        {/* Minutes */}
        <div onClick={() => { setIsMinuteEditing(true); setIsHourEditing(false); setIsSecondEditing(false); setTimeout(() => findEl(`pip-minute-${timer.id}`)?.focus()); }} className={isMinuteEditing ? 'hidden' : 'block cursor-text'}>
          {displayMinutes.toString().padStart(2, '0')}
        </div>
        {isMinuteEditing && (
          <input
            id={`pip-minute-${timer.id}`}
            type="number"
            max={59}
            min={0}
            defaultValue={displayMinutes.toString().padStart(2, '0')}
            onFocus={(e) => e.target.select()}
            onKeyDown={(e) => {
              if (e.key === 'Tab') {
                e.preventDefault();
                commitMinute(e.currentTarget);
                setIsMinuteEditing(false);
                if (e.shiftKey) {
                  setIsHourEditing(true);
                  focusTimeInput('hour');
                  return;
                }
                setIsSecondEditing(true);
                focusTimeInput('second');
              }
            }}
            onBlur={(e) => { commitMinute(e.currentTarget); setIsMinuteEditing(false); }}
            style={{ fontSize: 'inherit' }}
            className="font-mono text-center border-b dark:border-gray-700 focus:border-indigo-600 dark:focus:border-indigo-500 focus:outline-none w-[2ch] bg-transparent dark:text-white"
          />
        )}
        :
        {/* Seconds */}
        <div onClick={() => { setIsSecondEditing(true); setIsHourEditing(false); setIsMinuteEditing(false); setTimeout(() => findEl(`pip-second-${timer.id}`)?.focus()); }} className={isSecondEditing ? 'hidden' : 'block cursor-text'}>
          {displaySeconds.toString().padStart(2, '0')}
        </div>
        {isSecondEditing && (
          <input
            id={`pip-second-${timer.id}`}
            type="number"
            max={59}
            min={0}
            defaultValue={displaySeconds.toString().padStart(2, '0')}
            onFocus={(e) => e.target.select()}
            onKeyDown={(e) => {
              if (e.key === 'Tab' && e.shiftKey) {
                e.preventDefault();
                commitSecond(e.currentTarget);
                setIsSecondEditing(false);
                setIsMinuteEditing(true);
                focusTimeInput('minute');
              }
            }}
            onBlur={(e) => { commitSecond(e.currentTarget); setIsSecondEditing(false); }}
            style={{ fontSize: 'inherit' }}
            className="font-mono text-center border-b dark:border-gray-700 focus:border-indigo-600 dark:focus:border-indigo-500 focus:outline-none w-[2ch] bg-transparent dark:text-white"
          />
        )}
      </div>

      {/* Decimal time */}
      {showDecimalTime && containerHeight >= 100 && (
        <div className="font-mono text-center dark:text-white" style={{ fontSize: 'clamp(14px, 5vw, 24px)', marginTop: '-0.3em', marginBottom: 'clamp(8px, 2vh, 16px)' }}>
          {(() => {
            let decimalTime = hours + displayMinutes / 60;
            decimalTime = Math.round(decimalTime * 20) / 20;
            return decimalTime + 'h';
          })()}
        </div>
      )}

      {/* Controls row: pagination + play/pause + date */}
      <div className="grid w-full self-stretch items-center" style={{ gridTemplateColumns: '1fr auto 1fr' }}>
        {/* Timer selector (left) */}
        <div className="justify-self-start">
        {timers.length > 1 ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedIndex(i => (i - 1 + timers.length) % timers.length)}
              className="p-1 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              style={{ fontSize: 'clamp(10px, 3vw, 14px)' }}
            >
              <ChevronLeft style={{ width: 'clamp(12px, 3.5vw, 16px)', height: 'clamp(12px, 3.5vw, 16px)' }} />
            </button>
            <span className="text-gray-500 dark:text-gray-400 tabular-nums" style={{ fontSize: 'clamp(10px, 3vw, 14px)' }}>
              {selectedIndex + 1}/{timers.length}
            </span>
            <button
              onClick={() => setSelectedIndex(i => (i + 1) % timers.length)}
              className="p-1 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              style={{ fontSize: 'clamp(10px, 3vw, 14px)' }}
            >
              <ChevronRight style={{ width: 'clamp(12px, 3.5vw, 16px)', height: 'clamp(12px, 3.5vw, 16px)' }} />
            </button>
          </div>
        ) : null}
        </div>

        {/* Play/Pause (center) */}
        <button
          onClick={() => onToggle(timer.id)}
          className={`justify-self-center flex items-center justify-center rounded-lg transition-colors ${
            timer.isRunning
              ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/70'
              : 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/70'
          }`}
          style={{ padding: 'clamp(6px, 1.5vh, 12px)' }}
        >
          {timer.isRunning ? (
            <Pause style={{ width: 'clamp(14px, 5vw, 20px)', height: 'clamp(14px, 5vw, 20px)' }} />
          ) : (
            <Play style={{ width: 'clamp(14px, 5vw, 20px)', height: 'clamp(14px, 5vw, 20px)' }} />
          )}
        </button>

        {/* Date (right) */}
        <div className="justify-self-end">
        {showByDate && timer.creationDate ? (
          <span className="text-gray-400 dark:text-gray-500" style={{ fontSize: 'clamp(10px, 3vw, 14px)' }}>
            {(() => {
              const d = new Date(timer.creationDate);
              return d.toLocaleDateString('fr-FR', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              });
            })()}
          </span>
        ) : null}
        </div>
      </div>
      </div>

      {/* Goal progress bar */}
      {showGoals && timer.goalTime && containerHeight >= 150 && (() => {
        const goalProgress = Math.min(100, (displayTime / timer.goalTime) * 100);
        const goalReached = displayTime >= timer.goalTime;
        const formatGoal = (ms: number) => {
          const totalSec = Math.floor(ms / 1000);
          const h = Math.floor(totalSec / 3600);
          const m = Math.floor((totalSec % 3600) / 60);
          const s = totalSec % 60;
          if (h > 0 && m > 0) return `${h}h${m}min`;
          if (h > 0) return `${h}h`;
          if (m > 0 && s > 0) return `${m}min${s}s`;
          if (m > 0) return `${m}min`;
          return `${s}s`;
        };
        return (
          <div className="shrink-0 w-full relative overflow-hidden bg-gray-200 dark:bg-gray-700" style={{ height: 'clamp(6px, 1.5vh, 12px)', borderRadius: 'clamp(2px, 0.5vw, 4px)' }}>
            <div
              className={`absolute inset-0 ${goalReached ? 'bg-green-400 dark:bg-green-500' : 'bg-indigo-400 dark:bg-indigo-500'}`}
              style={{ transform: `scaleX(${goalProgress / 100})`, transformOrigin: 'left', willChange: 'transform' }}
            />
          </div>
        );
      })()}
    </div>
  );
}
