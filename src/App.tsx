import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, RefreshCw, Trash2, Plus, Timer } from 'lucide-react';

interface Timer {
  id: string;
  name: string;
  time: number;
  isRunning: boolean;
  startTime: number | null;
}

function App() {
  const [timers, setTimers] = useState<Timer[]>(() => {
    const saved = localStorage.getItem('timers');
    if (!saved) return [];

    const parsedTimers: Timer[] = JSON.parse(saved);
    
    // Calculate elapsed time for running timers since last save
    return parsedTimers.map(timer => {
      if (timer.isRunning && timer.startTime) {
        const now = Date.now();
        const elapsedSinceLastSave = now - timer.startTime;
        console.log(timer.time, elapsedSinceLastSave, timer.time + elapsedSinceLastSave)
        return {
          ...timer,
          time: timer.time + elapsedSinceLastSave,
          startTime: now
        };
      }
      return timer;
    });
  });
  
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
      
      // Save timers state on every update
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

  const addTimer = () => {
    const newTimer: Timer = {
      id: crypto.randomUUID(),
      name: 'Timer '+ (timers.length + 1),
      time: 0,
      isRunning: false,
      startTime: null
    };
    setTimers(prev => {
      const newTimers = [...prev, newTimer];
      localStorage.setItem('timers', JSON.stringify(newTimers));
      return newTimers;
    });
  };

  const toggleTimer = (id: string) => {
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

  const toggleAllTimers = () => {
    const now = Date.now();
    const allRunning = timers.every(timer => timer.isRunning);
    setTimers(prev => {
      const newTimers = prev.map(timer => ({
        ...timer,
        isRunning: !allRunning,
        startTime: !allRunning ? now : null
      }));
      localStorage.setItem('timers', JSON.stringify(newTimers));
      return newTimers;
    });
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    return `${hours.toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-12xl mx-auto">
        {/* <div className="flex flex-col sm:flex-row justify-between items-center mb-8 space-y-4 sm:space-y-0">
          <h1 className="text-3xl font-bold text-gray-800">Multi Timer</h1>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            {timers.length > 0 && (
              <button
                      onClick={toggleAllTimers}
                      className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
                    >
                      {timers.every(timer => timer.isRunning) ? <PauseCircle className="mr-2" /> : <PlayCircle className="mr-2" />}
                      {timers.every(timer => timer.isRunning) ? 'Pause All' : 'Play All'}
              </button>
            )}
            
            <button
              onClick={addTimer}
              className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors w-full sm:w-auto"
            >
              <Plus className="mr-2" />
              Add Timer
            </button>
          </div>
        </div> */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8">
          <div className="flex items-center gap-3 mb-4 sm:mb-0">
            <Timer className="w-8 h-8 text-indigo-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Multi Timer</h1>
          </div>
          <div className="flex items-center gap-4">
            {timers.length > 0 ? (
              timers.find(elem => elem.isRunning) ? (
                <button
                  onClick={toggleAllTimers}
                  className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Pause className="w-5 h-5" />
                  Pause All
                </button>
              ) : (
                <button
                  onClick={toggleAllTimers}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Play className="w-5 h-5" />
                  Start All
                </button>
              )
            ) : null}
            <button
              onClick={addTimer}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Timer
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {timers.map(timer => (
            <div
            key={timer.id}
            className="bg-white rounded-lg shadow-md p-4 sm:p-6 space-y-4"
          >
            <input
              type="text"
              value={timer.name}
              onChange={(e) => updateTimerName(timer.id, e.target.value)}
              className="w-full text-lg font-semibold bg-transparent border-b border-gray-200 focus:border-indigo-600 focus:outline-none pb-1"
            />
            <div className="text-4xl font-mono text-center py-4">
              {formatTime(timer.time)}
            </div>
            <div className="flex justify-between">
              <button
                onClick={() => toggleTimer(timer.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  timer.isRunning
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
                  onClick={() => resetTimer(timer.id)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <button
                  onClick={() => deleteTimer(timer.id)}
                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
            // <div key={timer.id} className="bg-white p-6 rounded-lg shadow-md">
            //   <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
            //     <input
            //       type="text"
            //       value={timer.name}
            //       onChange={(e) => updateTimerName(timer.id, e.target.value)}
            //       className="text-xl font-semibold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-2 py-1 w-full sm:w-auto"
            //     />
            //     <div className="text-2xl font-mono">{formatTime(timer.time)}</div>
            //   </div>
            //   <div className="flex justify-end space-x-2 mt-4">
            //     <button
            //       onClick={() => toggleTimer(timer.id)}
            //       className={`p-2 rounded-lg ${timer.isRunning ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'} hover:opacity-80 transition-opacity`}
            //     >
            //       {timer.isRunning ? <Pause size={20} /> : <Play size={20} />}
            //     </button>
            //     <button
            //       onClick={() => resetTimer(timer.id)}
            //       className="p-2 rounded-lg bg-blue-100 text-blue-700 hover:opacity-80 transition-opacity"
            //     >
            //       <RotateCcw size={20} />
            //     </button>
            //     <button
            //       onClick={() => deleteTimer(timer.id)}
            //       className="p-2 rounded-lg bg-red-100 text-red-700 hover:opacity-80 transition-opacity"
            //     >
            //       <Trash2 size={20} />
            //     </button>
            //   </div>
            // </div>
          ))}
        </div>

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