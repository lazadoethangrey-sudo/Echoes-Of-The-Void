
import React, { useState, useEffect } from 'react';
import { soundService } from '../services/soundService';

interface TitleScreenProps {
  onStart: () => void;
  onNewGame: () => void;
  onOpenSettings: () => void;
  saveData: {
    shards: number;
    exp: number;
    lastSaved?: string;
    exists: boolean;
  };
}

const TitleScreen: React.FC<TitleScreenProps> = ({ onStart, onNewGame, onOpenSettings, saveData }) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleExitGame = () => {
    soundService.play('CLICK');
    if (window.confirm("Are you sure you want to exit the expedition?")) {
      window.close();
      alert("Exiting via script is restricted by your browser. Please close this tab manually.");
    }
  };

  return (
    <div className={`relative w-full h-screen flex flex-col items-center justify-center overflow-hidden transition-opacity duration-1000 ${isReady ? 'opacity-100' : 'opacity-0'}`}>
      {showResetConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="glass p-10 rounded-3xl border-red-500/30 max-w-md text-center">
            <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 text-2xl animate-pulse">
              <i className="fas fa-triangle-exclamation"></i>
            </div>
            <h3 className="text-2xl font-cinzel text-white mb-4 tracking-widest">ERASE TIMELINE?</h3>
            <p className="text-slate-400 mb-8 italic text-sm leading-relaxed">
              "Starting a new expedition will collapse the current timeline. All Echoes, inventory, and Mastery will be lost forever."
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={onNewGame}
                className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black font-cinzel tracking-widest rounded-xl transition-all shadow-lg shadow-red-900/40 active:scale-95"
              >
                ERASE AND RESTART
              </button>
              <button 
                onClick={() => { soundService.play('CLICK'); setShowResetConfirm(false); }}
                className="w-full py-4 border border-slate-700 hover:border-slate-500 text-slate-400 font-black font-cinzel tracking-widest rounded-xl transition-all active:scale-95"
              >
                ABORT RESET
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Particle Orbs */}
      <div className="absolute inset-0 z-10 pointer-events-none opacity-40">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-violet-600/20 blur-3xl animate-float" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-1/3 right-1/4 w-40 h-40 bg-blue-600/10 blur-3xl animate-float" style={{ animationDuration: '10s', animationDelay: '2s' }}></div>
      </div>

      <div 
        className="absolute inset-0 bg-cover bg-center z-0 scale-125 blur-sm brightness-[0.3] transition-transform duration-[10s] animate-[zoom_20s_infinite_alternate]"
        style={{ backgroundImage: 'url(https://picsum.photos/seed/darkworld/1920/1080)' }}
      ></div>
      
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950 z-10 opacity-90"></div>

      <div className="relative z-20 flex flex-col items-center">
        <div className="mb-2 text-violet-500/60 font-cinzel tracking-[1em] text-[10px] uppercase animate-pulse">Void Presence Detected</div>
        <h1 className="text-7xl md:text-9xl font-black font-cinzel text-glow tracking-[0.2em] text-white mb-2 transition-all duration-1000">
          ECHOES
        </h1>
        <h2 className="text-2xl md:text-4xl font-cinzel text-violet-400 tracking-widest mb-12 opacity-80">
          OF THE VOID
        </h2>

        {saveData.exists && (
          <div className="mb-10 w-80 glass p-5 rounded-2xl border-violet-500/20 animate-in slide-in-from-bottom-8 duration-1000">
             <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                <span className="text-[9px] font-black text-violet-400 uppercase tracking-widest">Archive Detected</span>
                <div className="flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                   <span className="text-[7px] text-emerald-500 font-bold uppercase">Ready</span>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="group cursor-default">
                   <div className="text-[8px] text-slate-500 uppercase font-black mb-1 group-hover:text-violet-400 transition-colors">Mastery</div>
                   <div className="text-xs font-mono text-white font-bold">{saveData.exp.toLocaleString()} EXP</div>
                </div>
                <div className="group cursor-default">
                   <div className="text-[8px] text-slate-500 uppercase font-black mb-1 group-hover:text-violet-400 transition-colors">Currency</div>
                   <div className="text-xs font-mono text-white font-bold">{saveData.shards.toLocaleString()}</div>
                </div>
             </div>
             <div className="mt-4 text-center">
                <div className="text-[7px] text-slate-600 uppercase font-bold tracking-widest opacity-80">Last Synced: {formatDate(saveData.lastSaved)}</div>
             </div>
          </div>
        )}

        <div className="flex flex-col gap-4 w-72 stagger-in">
          <button 
            onClick={onStart}
            className="group relative px-8 py-5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(139,92,246,0.4)] border-t border-violet-400/30 overflow-hidden"
          >
            <span className="relative z-10 font-cinzel tracking-widest text-xl uppercase font-black">
              {saveData.exists ? 'Continue' : 'Enter Void'}
            </span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity rounded-xl"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </button>
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={onOpenSettings}
              className="px-4 py-3 border border-slate-700 hover:border-violet-500 bg-slate-900/40 text-slate-300 hover:text-white font-bold rounded-xl transition-all font-cinzel tracking-widest text-[9px] uppercase active:scale-95 hover:bg-violet-900/10"
            >
              Settings
            </button>
            <button 
              onClick={handleExitGame}
              className="px-4 py-3 border border-slate-700 hover:border-red-500/50 bg-slate-900/40 text-slate-400 hover:text-red-400 font-bold rounded-xl transition-all font-cinzel tracking-widest text-[9px] uppercase active:scale-95 hover:bg-red-950/20"
            >
              Quit Game
            </button>
          </div>

          {saveData.exists && (
            <button 
              onClick={() => { soundService.play('CLICK'); setShowResetConfirm(true); }}
              className="px-8 py-2.5 border border-red-900/20 hover:border-red-500/40 bg-red-950/5 text-red-500/30 hover:text-red-500/70 font-medium rounded-xl transition-all font-cinzel tracking-widest text-[7px] uppercase active:scale-95 mt-2"
            >
              Reset Timeline
            </button>
          )}
        </div>
      </div>

      <div className="absolute bottom-8 flex flex-col items-center gap-1 z-20 opacity-50 hover:opacity-100 transition-opacity">
        <div className="text-slate-600 font-cinzel tracking-widest text-[9px] uppercase">VoidWorks Studio &copy; 2025</div>
        <div className="text-slate-500 font-cinzel tracking-widest text-[8px] uppercase mt-1">
          made by <span className="text-slate-400 font-bold">Voidworks</span> constructed with <span className="text-violet-400 font-bold">gemini</span>
        </div>
      </div>

      <div className="scanline"></div>

      <style>{`
        @keyframes zoom {
          from { transform: scale(1.15); }
          to { transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
};

export default TitleScreen;
