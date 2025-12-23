
import React from 'react';
import { AppState } from '../types';

interface WatchFaceProps {
  appState: AppState;
  countdownText: string;
  nextPingAt: string;
  onStart: () => void;
  onContinue: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onShowHistory: () => void;
  onShowSettings: () => void;
  error: string | null;
  locationName: string;
  summary?: string;
  hasLastTask?: boolean;
  lastTaskSummary?: string;
}

const WatchFace: React.FC<WatchFaceProps> = ({ 
  appState, countdownText, nextPingAt, onStart, onContinue, onConfirm, onCancel, 
  onShowHistory, onShowSettings, error, locationName, summary, hasLastTask, lastTaskSummary 
}) => {
  const isBusy = appState === AppState.LISTENING || appState === AppState.PROCESSING || appState === AppState.SYNCING;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full space-y-2 animate-in fade-in duration-500">
      
      {/* Top Bar */}
      <div className="absolute top-10 flex items-center justify-between w-full px-12">
        <button onClick={onShowSettings} className="p-2 text-gray-600 hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        <div className="flex items-center space-x-1 text-[9px] text-blue-400 mono truncate max-w-[80px]">
          <span className="truncate">{locationName}</span>
        </div>
        <button onClick={onShowHistory} className="p-2 text-gray-600 hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      {appState === AppState.CONFIRMING ? (
        <div className="flex flex-col items-center space-y-3 animate-in zoom-in duration-300">
          <div className="text-[10px] text-blue-400 uppercase tracking-widest mono">Confirm Log?</div>
          <div className="text-sm font-medium text-white px-4 leading-tight min-h-[40px] flex items-center justify-center text-center w-full">{summary}</div>
          <div className="flex space-x-4">
            <button onClick={onCancel} className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-red-400 active:scale-95 transition-transform">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <button onClick={onConfirm} className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-transform">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="text-[10px] uppercase tracking-widest text-gray-500 mono mb-1">Ping at {nextPingAt}</div>
          <div className="text-4xl font-light tracking-tighter mono tabular-nums text-white mb-4">{countdownText}</div>

          <div className="relative flex items-center justify-center">
            {/* Continue Last Task Button */}
            {hasLastTask && appState === AppState.IDLE && (
              <button 
                onClick={onContinue}
                className="absolute -top-6 bg-zinc-900 border border-white/10 rounded-full px-3 py-1 flex items-center space-x-1 animate-in slide-in-from-bottom duration-500 hover:bg-zinc-800"
              >
                <svg className="w-2.5 h-2.5 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path d="M4.53 4.53a.75.75 0 011.06 0L10 8.94l4.41-4.41a.75.75 0 111.06 1.06L11.06 10l4.41 4.41a.75.75 0 01-1.06 1.06L10 11.06l-4.41 4.41a.75.75 0 01-1.06-1.06L8.94 10 4.53 5.59a.75.75 0 010-1.06z" /></svg>
                <span className="text-[8px] text-gray-300 font-bold uppercase mono truncate max-w-[80px]">Still {lastTaskSummary}?</span>
              </button>
            )}

            <button
              onClick={onStart}
              disabled={isBusy}
              className={`
                relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300
                ${appState === AppState.LISTENING ? 'bg-red-500 scale-110 shadow-lg shadow-red-500/40' : 
                  appState === AppState.PROCESSING || appState === AppState.SYNCING ? 'bg-yellow-500 animate-pulse' : 
                  'bg-blue-600 hover:bg-blue-500 active:scale-95 shadow-xl shadow-blue-600/20'}
              `}
            >
              {appState === AppState.LISTENING && <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />}
              {appState === AppState.LISTENING ? <div className="w-6 h-6 bg-white rounded-sm" /> : 
               appState === AppState.PROCESSING || appState === AppState.SYNCING ? <svg className="w-8 h-8 text-white animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> :
               <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>}
            </button>
          </div>

          <div className="h-6 mt-3">
            {appState === AppState.LISTENING && <p className="text-[10px] text-blue-400 italic animate-pulse">Listening...</p>}
            {appState === AppState.PROCESSING && <p className="text-[10px] text-yellow-400 italic">Gemini is shortening...</p>}
            {appState === AppState.SYNCING && <p className="text-[10px] text-blue-300 italic">Syncing to Cloud...</p>}
            {appState === AppState.SUCCESS && <p className="text-[10px] text-green-400 font-medium animate-bounce">Success!</p>}
            {error && <p className="text-[8px] text-red-500 px-4 leading-tight">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default WatchFace;
