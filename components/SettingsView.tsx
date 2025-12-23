
import React, { useState } from 'react';

interface SettingsViewProps {
  clientId: string;
  spreadsheetId: string;
  pingInterval: number;
  onSave: (cid: string, sid: string, interval: number) => void;
  onBack: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ clientId, spreadsheetId, pingInterval, onSave, onBack }) => {
  const [cid, setCid] = useState(clientId);
  const [sid, setSid] = useState(spreadsheetId);
  const [interval, setIntervalVal] = useState(pingInterval);
  const currentOrigin = window.location.origin;

  const copyOrigin = () => {
    navigator.clipboard.writeText(currentOrigin);
    alert('Copied! Paste this into "Authorized JavaScript origins" in Google Cloud.');
  };

  return (
    <div className="flex flex-col w-full h-full bg-zinc-950 p-6 animate-in slide-in-from-top duration-300">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mono font-bold">Watch Settings</h2>
        <button onClick={onBack} className="text-gray-400 p-1 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="flex-1 flex flex-col space-y-4 overflow-y-auto custom-scrollbar pr-1 pb-4">
        
        {/* Interval Selector */}
        <div className="space-y-2">
          <label className="text-[7px] text-blue-400 uppercase mono block font-semibold">Ping Interval</label>
          <div className="grid grid-cols-4 gap-1">
            {[30, 60, 120, 240].map((val) => (
              <button
                key={val}
                onClick={() => setIntervalVal(val)}
                className={`text-[9px] py-2 rounded border transition-all mono font-bold ${
                  interval === val 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'bg-zinc-900 border-white/5 text-gray-500 hover:border-white/20'
                }`}
              >
                {val >= 60 ? `${val/60}h` : `${val}m`}
              </button>
            ))}
          </div>
        </div>

        {/* Auth Inputs */}
        <div className="space-y-1">
          <label className="text-[7px] text-blue-400 uppercase mono block font-semibold">Google Client ID</label>
          <input 
            type="text" 
            value={cid}
            onChange={(e) => setCid(e.target.value)}
            className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2 text-[9px] text-white mono outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[7px] text-blue-400 uppercase mono block font-semibold">Spreadsheet ID</label>
          <input 
            type="text" 
            value={sid}
            onChange={(e) => setSid(e.target.value)}
            placeholder="From your Sheet URL"
            className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2 text-[9px] text-white mono outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>

        {/* Troubleshooting (Smaller) */}
        <div className="bg-blue-600/5 border border-blue-500/20 rounded-xl p-2">
          <button 
            onClick={copyOrigin}
            className="w-full text-[7px] text-blue-300 font-bold uppercase tracking-widest text-left flex justify-between items-center"
          >
            <span>Auth Troubleshooting</span>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
          </button>
        </div>
        
        <div className="pt-2">
          <button 
            onClick={() => onSave(cid, sid, interval)}
            className="w-full bg-white text-black py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-gray-200 active:scale-95 transition-all shadow-xl"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
