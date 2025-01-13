import React, { useState, useRef } from 'react';
import { Timer, Plus, Trash2, Play, Pause, RefreshCw } from 'lucide-react';

interface Chronometer {
  id: string;
  time: number; // In milliseconds
  isRunning: boolean;
  name: string;
  lastUpdateTime?: number;
}

function App() {
  const [chronometers, setChronometers] = useState<Chronometer[]>([]);
  const requestRef = useRef<number>(0); // Pour stocker l'ID de la dernière frame d'animation
  const lastTimestampRef = useRef<number>(0);

  const addChronometer = () => {
    const newChronometer: Chronometer = {
      id: crypto.randomUUID(),
      time: 0,
      isRunning: false,
      name: `Timer ${chronometers.length + 1}`,
      lastUpdateTime: undefined,
    };
    setChronometers([...chronometers, newChronometer]);
    // localStorage.setItem('chronometers', JSON.stringify([...chronometers, newChronometer]));
  };

  const pauseAllChronometers = () => {
    setChronometers(chronometers.map(chrono => ({ ...chrono, isRunning: false, lastUpdateTime: undefined })));
    // localStorage.setItem('chronometers', JSON.stringify(chronometers.map(chrono => ({ ...chrono, isRunning: false, lastUpdateTime: undefined }))));
  };
  
  const playAllChronometers = () => {
    setChronometers(chronometers.map(chrono => ({ ...chrono, isRunning: true, lastUpdateTime: Date.now() })));
    // localStorage.setItem('chronometers', JSON.stringify(chronometers.map(chrono => ({ ...chrono, isRunning: true, lastUpdateTime: Date.now() }))));
  };

  const toggleChronometer = (id: string) => {
    setChronometers(chronometers.map(chrono =>
      chrono.id === id
        ? {
            ...chrono,
            isRunning: !chrono.isRunning,
            lastUpdateTime: !chrono.isRunning ? Date.now() : chrono.lastUpdateTime,
          }
        : chrono
    ));
    // localStorage.setItem('chronometers', JSON.stringify(chronometers.map(chrono =>
    //   chrono.id === id
    //     ? {
    //         ...chrono,
    //         isRunning: !chrono.isRunning,
    //         lastUpdateTime: !chrono.isRunning ? Date.now() : chrono.lastUpdateTime,
    //       }
    //     : chrono
    // )));
  };

  const resetChronometer = (id: string) => {
    setChronometers(chronometers.map(chrono =>
      chrono.id === id ? { ...chrono, time: 0, isRunning: false } : chrono
    ));
    // localStorage.setItem('chronometers', JSON.stringify(chronometers.map(chrono =>
    //   chrono.id === id ? { ...chrono, time: 0, isRunning: false } : chrono
    // )));
  };

  const deleteChronometer = (id: string) => {
    setChronometers(chronometers.filter(chrono => chrono.id !== id));
    // localStorage.setItem('chronometers', JSON.stringify(chronometers.filter(chrono => chrono.id !== id)));
  };

  const updateName = (id: string, newName: string) => {
    setChronometers(chronometers.map(chrono =>
      chrono.id === id ? { ...chrono, name: newName } : chrono
    ));
    // localStorage.setItem('chronometers', JSON.stringify(chronometers.map(chrono =>
    //   chrono.id === id ? { ...chrono, name: newName } : chrono
    // )));
  };

  // React.useEffect(() => {
  //   if (Notification.permission === 'default') {
  //     Notification.requestPermission().catch((error) =>
  //       console.error('Notification permission error:', error)
  //     );
  //   }
  //   // const savedChronometers = localStorage.getItem('chronometers');
  //   // if (savedChronometers) {
  //   //   setChronometers(JSON.parse(savedChronometers));
  //   // }
  // }, []);

  // React.useEffect(() => {
  //   let animationFrameId: number;
  
  //   const updateChronometers = () => {
  //     setChronometers(chronos =>
  //       chronos.map(chrono => {
  //         if (!chrono.isRunning) return chrono;
  
  //         const now = Date.now();
  //         const elapsedTime = now - (chrono.lastUpdateTime || now);
  
  //         const newTime = chrono.time + elapsedTime;
  //         return {
  //           ...chrono,
  //           time: newTime,
  //           lastUpdateTime: now,
  //         };
  //       })
  //     );
  //     localStorage.setItem('chronometers', JSON.stringify(chronometers));
  //     animationFrameId = requestAnimationFrame(updateChronometers);
  //   };
  
  //   updateChronometers();
  
  //   return () => cancelAnimationFrame(animationFrameId);
  // }, []);

  // Mettre à jour les chronomètres à chaque frame
  // React.useEffect(() => {
  //   let animationFrameId: number;
    
  //   const updateChronometers = () => {
  //     setChronometers(chronos =>
  //       chronos.map(chrono => {
  //         if (!chrono.isRunning) return chrono;

  //         const now = Date.now();
  //         const elapsedTime = now - (chrono.lastUpdateTime || now);

  //         const newTime = chrono.time + elapsedTime;

  //         // Check if it's time to notify (1 minute = 60,000 ms)
  //         if (newTime % 60000 < 1000 && newTime > 0) {
  //           // Display notification
  //           if (Notification.permission === 'granted') {
  //             new Notification(`Timer ${chrono.name} - 1 minute of activity!`);
  //           }
  //         }

  //         return {
  //           ...chrono,
  //           time: newTime,
  //           lastUpdateTime: now,
  //         };
  //       })
  //     );
  //     // localStorage.setItem('chronometers', JSON.stringify(chronometers));
  //     animationFrameId = requestAnimationFrame(updateChronometers);
  //   };

  //   updateChronometers();

  //   return () => cancelAnimationFrame(animationFrameId);
  // }, [chronometers]);

  const formatTime = (milliseconds: number) => {
    const hrs = Math.floor(milliseconds / 3600000);
    const mins = Math.floor((milliseconds % 3600000) / 60000);
    const secs = Math.floor((milliseconds % 60000) / 1000);
    const ms = milliseconds % 1000;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  const sendNotification = () => {
    chronometers.forEach((chrono) => {
      if (chrono.isRunning) {
        const now = Date.now();
        const elapsedTime = now - (chrono.lastUpdateTime || now);
        const newTime = chrono.time + elapsedTime;

        if (newTime % 60000 < 1000 && newTime > 0) {
          if (Notification.permission === 'granted') {
            new Notification(`Timer ${chrono.name} - 1 minute d'activité !`);
          }
        }
        setChronometers((prev) => 
          prev.map((c) => 
            c.id === chrono.id 
            ? { ...c, time: newTime, lastUpdateTime: now } 
            : c
          )
        );
      }
    });
  };

  React.useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch((error) => console.error('Notification permission error:', error));
    }

    const savedChronometers = localStorage.getItem('chronometers');
    if (savedChronometers) {
      setChronometers(JSON.parse(savedChronometers));
    }

    // Gestion de la visibilité de l'onglet pour activer les timers en arrière-plan
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        lastTimestampRef.current = Date.now();
      } else {
        // Réactive la logique du chronomètre quand l'onglet devient visible
        chronometers.forEach((chrono) => {
          if (chrono.isRunning) {
            setChronometers((prev) =>
              prev.map((c) =>
                c.id === chrono.id
                  ? { ...c, lastUpdateTime: Date.now() }
                  : c
              )
            );
          }
        });
      }
    });

    // Fonction pour gérer les animations et les mises à jour régulières des chronos
    const update = (time: number) => {
      chronometers.forEach((chrono) => {
        if (chrono.isRunning) {
          const now = Date.now();
          const elapsedTime = now - (chrono.lastUpdateTime || now);
          const newTime = chrono.time + elapsedTime;

          setChronometers((prev) =>
            prev.map((c) =>
              c.id === chrono.id
                ? { ...c, time: newTime, lastUpdateTime: now }
                : c
            )
          );
        }
      });

      // Continue l'animation frame
      requestRef.current = requestAnimationFrame(update);
    };

    // Lancer l'animation frame
    requestRef.current = requestAnimationFrame(update);

    // Démarrer l'intervalle de notification
    const notificationInterval = setInterval(sendNotification, 60000);

    // Nettoyage lors du démontage
    return () => {
      cancelAnimationFrame(requestRef.current);
      clearInterval(notificationInterval);
    };
  }, [chronometers]);

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-12xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8">
          <div className="flex items-center gap-3 mb-4 sm:mb-0">
            <Timer className="w-8 h-8 text-indigo-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Multi Timer</h1>
          </div>
          <div className="flex items-center gap-4">
            {chronometers.length > 0 ? (
              chronometers.find(elem => elem.isRunning) ? (
                <button
                  onClick={pauseAllChronometers}
                  className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Pause className="w-5 h-5" />
                  Pause All
                </button>
              ) : (
                <button
                  onClick={playAllChronometers}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Play className="w-5 h-5" />
                  Play All
                </button>
              )
            ) : null}
            <button
              onClick={addChronometer}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Timer
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {chronometers.map(chrono => (
            <div
              key={chrono.id}
              className="bg-white rounded-lg shadow-md p-4 sm:p-6 space-y-4"
            >
              <input
                type="text"
                value={chrono.name}
                onChange={(e) => updateName(chrono.id, e.target.value)}
                className="w-full text-lg font-semibold bg-transparent border-b border-gray-200 focus:border-indigo-600 focus:outline-none pb-1"
              />
              <div className="text-4xl font-mono text-center py-4">
                {formatTime(chrono.time)}
              </div>
              <div className="flex justify-between">
                <button
                  onClick={() => toggleChronometer(chrono.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    chrono.isRunning
                      ? 'bg-red-100 text-red-600 hover:bg-red-200'
                      : 'bg-green-100 text-green-600 hover:bg-green-200'
                  }`}
                >
                  {chrono.isRunning ? (
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
                    onClick={() => resetChronometer(chrono.id)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => deleteChronometer(chrono.id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {chronometers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No chronometers yet. Click the "Add Timer" button to create one!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
