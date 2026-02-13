
import React from 'react';
import { GameSettings } from '../types';
import { soundService } from '../services/soundService';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (settings: GameSettings) => void;
  onExport: () => void;
  onImport: (json: string) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onUpdateSettings, onClose }) => {
  const handleClearLocal = () => {
    if (confirm("This will erase all progress in this timeline. This action cannot be undone. Proceed?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <div className="max-w-md w-full glass p-8 rounded-3xl border-violet-500/30 flex flex-col relative overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)]">
        <div className="absolute top-0 left-0 w-full h-1 bg-violet-600 shadow-[0_0_15px_rgba(139,92,246,0.8)]"></div>
        
        <header className="flex justify-between items-center mb-8">
          <div className="flex flex-col">
            <h2 className="text-2xl font-cinzel text-white font-black tracking-widest uppercase">System Config</h2>
            <span className="text-[7px] font-black font-cinzel text-violet-500 uppercase tracking-[0.3em]">Neural Link Stable</span>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </header>

        <div className="space-y-8 pr-2 custom-scrollbar">
          {/* Audio Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-violet-400">
              <i className="fas fa-volume-high text-xs"></i>
              <span className="text-[10px] font-black uppercase tracking-widest font-cinzel">Audio Transmissions</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-800">
              <span className="text-sm text-slate-300 font-cinzel">Background Music</span>
              <button 
                onClick={() => onUpdateSettings({ ...settings, musicEnabled: !settings.musicEnabled })}
                className={`w-12 h-6 rounded-full transition-all relative ${settings.musicEnabled ? 'bg-violet-600' : 'bg-slate-800'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.musicEnabled ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>

            <div className="space-y-2 px-2">
              <div className="flex justify-between text-[10px] text-slate-500 font-black uppercase tracking-tighter">
                <span>Output Volume</span>
                <span>{Math.round(settings.musicVolume * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0" max="1" step="0.01" 
                value={settings.musicVolume}
                onChange={(e) => onUpdateSettings({ ...settings, musicVolume: parseFloat(e.target.value) })}
                className="w-full accent-violet-600 h-1 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </section>

          {/* Visuals Section */}
          <section className="space-y-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2 text-emerald-400">
              <i className="fas fa-eye text-xs"></i>
              <span className="text-[10px] font-black uppercase tracking-widest font-cinzel">Visual Effects</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-800">
              <span className="text-sm text-slate-300 font-cinzel">Screen Shake</span>
              <button 
                onClick={() => onUpdateSettings({ ...settings, screenShakeEnabled: !settings.screenShakeEnabled })}
                className={`w-12 h-6 rounded-full transition-all relative ${settings.screenShakeEnabled ? 'bg-emerald-600' : 'bg-slate-800'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.screenShakeEnabled ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>
          </section>

          <section className="pt-4 border-t border-white/5">
            <button 
              onClick={handleClearLocal}
              className="w-full py-4 bg-red-950/20 border border-red-900/30 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-[10px] font-black font-cinzel tracking-widest transition-all uppercase"
            >
              Reset All Progress
            </button>
          </section>
        </div>

        <button 
          onClick={onClose}
          className="mt-10 w-full py-4 bg-violet-600 hover:bg-violet-500 text-white font-black font-cinzel tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] uppercase active:scale-95"
        >
          Close Config
        </button>
      </div>
    </div>
  );
};

export default SettingsModal;
