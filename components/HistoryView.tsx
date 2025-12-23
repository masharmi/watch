
import React from 'react';
import { LogEntry } from '../types';

interface HistoryViewProps {
  logs: LogEntry[];
  onBack: () => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ logs, onBack }) => {
  return (
    <div className="flex flex-col w-full h-full bg-black animate-in slide-in-from-bottom duration-300">
      <div className="pt-8 pb-4 border-b border-white/10 sticky top-0 bg-black/80 backdrop-blur z-20">
        <button 
          onClick={onBack}
          className="flex items-center justify-center space-x-2 w-full text-xs text-blue-400 uppercase tracking-widest"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
          </svg>
          <span>Back to Face</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar scroll-smooth">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-2 opacity-50">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs italic">No logs yet today</p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-[10px] text-blue-400 mono">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {log.location && (
                    <div className="flex items-center space-x-1 text-[8px] text-gray-500 mono">
                      <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      <span className="truncate max-w-[80px]">{log.location}</span>
                    </div>
                  )}
                </div>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[8px] uppercase tracking-tighter">
                  {log.sheetRow.category}
                </span>
              </div>
              
              <h3 className="text-sm font-medium text-white leading-tight">
                {log.summary}
              </h3>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                  <div className="text-[8px] text-gray-500 uppercase tracking-widest mb-1">Calendar</div>
                  <div className="text-[9px] text-white/80 line-clamp-1">{log.calendarEvent.title}</div>
                  <div className="text-[7px] text-gray-500 mono">{log.calendarEvent.start} - {log.calendarEvent.end}</div>
                </div>
                <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                  <div className="text-[8px] text-gray-500 uppercase tracking-widest mb-1">Sheets</div>
                  <div className="text-[9px] text-white/80 line-clamp-1 truncate">{log.sheetRow.activity}</div>
                  <div className="text-[7px] text-gray-500 mono">{log.sheetRow.duration}</div>
                </div>
              </div>

              <p className="text-[9px] text-gray-500 italic border-t border-white/5 pt-2">
                "{log.originalText}"
              </p>
            </div>
          ))
        )}
        {/* Padding for scroll room */}
        <div className="h-16" />
      </div>
    </div>
  );
};

export default HistoryView;
