
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LogEntry, AppState } from './types';
import { processVoiceLog } from './services/geminiService';
import { createCalendarEvent, appendToSheet, setAccessToken, hasAccessToken } from './services/googleApiService';
import WatchFace from './components/WatchFace';
import HistoryView from './components/HistoryView';
import SettingsView from './components/SettingsView';

const DEFAULT_CLIENT_ID = '406378955104-ahqtri6ph30fkob09e9glr9tvj5e8fm1.apps.googleusercontent.com';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<LogEntry | null>(null);
  const [view, setView] = useState<'watch' | 'history' | 'settings'>('watch');
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [nextPingTime, setNextPingTime] = useState('');
  const [locationName, setLocationName] = useState<string>('Detecting...');
  
  const [clientId, setClientId] = useState(localStorage.getItem('google_client_id') || DEFAULT_CLIENT_ID);
  const [spreadsheetId, setSpreadsheetId] = useState(localStorage.getItem('google_sheet_id') || '');
  const [pingInterval, setPingInterval] = useState<number>(parseInt(localStorage.getItem('ping_interval') || '60', 10));
  const [isAuthed, setIsAuthed] = useState(false);

  const recognitionRef = useRef<any>(null);
  const wakeLockRef = useRef<any>(null);
  const tokenClientRef = useRef<any>(null);
  const lastPingHourRef = useRef<number>(-1);
  const appStateRef = useRef<AppState>(AppState.IDLE);

  useEffect(() => {
    appStateRef.current = appState;
  }, [appState]);

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      }
    } catch (err) {}
  };

  const initGoogleAuth = useCallback(() => {
    if (clientId && (window as any).google) {
      try {
        tokenClientRef.current = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/spreadsheets',
          callback: (response: any) => {
            if (response.access_token) {
              setAccessToken(response.access_token);
              setIsAuthed(true);
              setError(null);
            } else if (response.error) {
              setAppState(AppState.ERROR);
              setError(`Google Auth Error: ${response.error}`);
            }
          },
        });
      } catch (e) {
        console.error("Auth Init Error:", e);
      }
    }
  }, [clientId]);

  useEffect(() => {
    const interval = setInterval(() => {
      if ((window as any).google && !tokenClientRef.current && clientId) {
        initGoogleAuth();
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [initGoogleAuth, clientId]);

  const fetchLocation = useCallback(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18`);
            const data = await response.json();
            const place = data.address.building || data.address.office || data.address.amenity || data.address.road || "Nearby Spot";
            setLocationName(place);
          } catch {
            setLocationName(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
          }
        },
        () => setLocationName('GPS Unavailable'),
        { timeout: 8000 }
      );
    }
  }, []);

  const triggerPing = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate([400, 100, 400, 100, 400]);
    fetchLocation();
    setAppState(AppState.IDLE);
    // Visual cue that a ping just happened is implicitly handled by the user being asked to log
  }, [fetchLocation]);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const currentSeconds = (now.getMinutes() * 60) + now.getSeconds();
      const intervalInSeconds = pingInterval * 60;
      
      const secondsSinceLastPing = currentSeconds % intervalInSeconds;
      const secsToNextPing = intervalInSeconds - secondsSinceLastPing;
      
      setCountdown(secsToNextPing);
      
      const nextPingDate = new Date(now.getTime() + (secsToNextPing * 1000));
      setNextPingTime(nextPingDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

      // Detect "just passed" an interval boundary
      const currentIntervalIndex = Math.floor((now.getHours() * 60 + now.getMinutes()) / pingInterval);
      if (lastPingHourRef.current !== -1 && lastPingHourRef.current !== currentIntervalIndex) {
        if (appStateRef.current === AppState.IDLE) {
          triggerPing();
        }
      }
      lastPingHourRef.current = currentIntervalIndex;
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    requestWakeLock();
    return () => { clearInterval(interval); if (wakeLockRef.current) wakeLockRef.current.release(); };
  }, [triggerPing, pingInterval]);

  useEffect(() => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      recognitionRef.current = new SpeechRec();
      recognitionRef.current.onresult = (e: any) => handleProcessing(e.results[0][0].transcript);
      recognitionRef.current.onerror = (e: any) => {
        if (e.error !== 'no-speech') {
           setAppState(AppState.ERROR);
           setError(`Mic error: ${e.error}`);
        } else {
           setAppState(AppState.IDLE);
        }
      };
      recognitionRef.current.onend = () => {
        if (appStateRef.current === AppState.LISTENING) setAppState(AppState.IDLE);
      };
    }
  }, [locationName]);

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        if (navigator.vibrate) navigator.vibrate(80);
        setAppState(AppState.LISTENING);
        recognitionRef.current.start();
      } catch (e) {}
    }
  };

  const continueLastTask = useCallback(() => {
    if (logs.length === 0) return;
    const last = logs[0];
    const now = new Date();
    const startTime = new Date(now.getTime() - (pingInterval * 60 * 1000));
    
    const newEntry: LogEntry = {
      ...last,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      calendarEvent: {
        ...last.calendarEvent,
        start: startTime.toISOString(),
        end: now.toISOString()
      },
      sheetRow: {
        ...last.sheetRow,
        date: now.toISOString().split('T')[0]
      }
    };
    setCurrentEntry(newEntry);
    setAppState(AppState.SYNCING);
    // The useEffect will trigger confirmAndSync if auth is ready
  }, [logs, pingInterval]);

  const handleProcessing = async (text: string) => {
    setAppState(AppState.PROCESSING);
    try {
      const result = await processVoiceLog(text, locationName);
      const entry: LogEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        originalText: text,
        location: locationName,
        summary: result.summary!,
        calendarEvent: result.calendarEvent!,
        sheetRow: result.sheetRow!,
      };
      setCurrentEntry(entry);
      setAppState(AppState.CONFIRMING);
    } catch (err) {
      setError("AI Analysis failed");
      setAppState(AppState.ERROR);
      setTimeout(() => setAppState(AppState.IDLE), 3000);
    }
  };

  const confirmAndSync = async () => {
    if (!currentEntry) return;
    
    if (!clientId) {
      setLogs(prev => [currentEntry, ...prev]);
      setAppState(AppState.SUCCESS);
      setCurrentEntry(null);
      setTimeout(() => setAppState(AppState.IDLE), 2000);
      return;
    }

    if (!hasAccessToken()) {
      setAppState(AppState.SYNCING);
      if (tokenClientRef.current) {
        tokenClientRef.current.requestAccessToken();
      } else {
        setError("Missing Google ID in Settings");
        setAppState(AppState.ERROR);
        setTimeout(() => setAppState(AppState.IDLE), 3000);
      }
      return;
    }

    setAppState(AppState.SYNCING);
    try {
      await createCalendarEvent(currentEntry);
      if (spreadsheetId) {
        await appendToSheet(currentEntry, spreadsheetId);
      }
      setLogs(prev => [currentEntry, ...prev]);
      setAppState(AppState.SUCCESS);
      setCurrentEntry(null);
    } catch (e: any) {
      setError("Cloud Sync Error - Check Console");
      setAppState(AppState.ERROR);
    } finally {
      setTimeout(() => {
        if (appStateRef.current === AppState.SUCCESS || appStateRef.current === AppState.ERROR) {
          setAppState(AppState.IDLE);
        }
      }, 2000);
    }
  };

  useEffect(() => {
    if (appState === AppState.SYNCING && isAuthed && currentEntry) {
      confirmAndSync();
    }
  }, [isAuthed, appState, currentEntry]);

  const saveSettings = (cid: string, sid: string, interval: number) => {
    setClientId(cid);
    setSpreadsheetId(sid);
    setPingInterval(interval);
    localStorage.setItem('google_client_id', cid);
    localStorage.setItem('google_sheet_id', sid);
    localStorage.setItem('ping_interval', interval.toString());
    setView('watch');
    setIsAuthed(false);
    setAccessToken('');
    tokenClientRef.current = null;
    initGoogleAuth();
  };

  return (
    <div className="watch-frame bg-black relative flex flex-col items-center justify-center p-8 text-center">
      {view === 'history' && <HistoryView logs={logs} onBack={() => setView('watch')} />}
      {view === 'settings' && (
        <SettingsView 
          clientId={clientId} 
          spreadsheetId={spreadsheetId} 
          pingInterval={pingInterval}
          onSave={saveSettings} 
          onBack={() => setView('watch')} 
        />
      )}
      {view === 'watch' && (
        <WatchFace 
          appState={appState}
          countdownText={`${Math.floor(countdown/60)}:${(countdown%60).toString().padStart(2,'0')}`}
          nextPingAt={nextPingTime}
          onStart={startListening}
          onContinue={continueLastTask}
          onConfirm={confirmAndSync}
          onCancel={() => { setAppState(AppState.IDLE); setCurrentEntry(null); }}
          onShowHistory={() => setView('history')}
          onShowSettings={() => setView('settings')}
          error={error}
          locationName={locationName}
          summary={currentEntry?.summary}
          hasLastTask={logs.length > 0}
          lastTaskSummary={logs[0]?.summary}
        />
      )}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="48" fill="none" stroke="#222" strokeWidth="1" />
        <circle 
          cx="50" cy="50" r="48" fill="none" stroke="#3b82f6" strokeWidth="1.5" 
          strokeDasharray="301.6" 
          strokeDashoffset={301.6 - (301.6 * countdown / (pingInterval * 60))} 
          strokeLinecap="round" 
          className="transition-all duration-1000 ease-linear shadow-blue-500 shadow-lg" 
        />
      </svg>
    </div>
  );
};

export default App;
