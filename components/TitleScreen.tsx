
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
    if (!dateStr) return 'No Logs';
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' @ ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`relative w-full h-screen flex flex-col items-center justify-center overflow-hidden transition-opacity duration-[1.5s] ${isReady ? 'opacity-100' : 'opacity-0'}`}>
      
      {/* Dynamic Background System */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center scale-110 brightness-[0.25] saturate-[0.5] transition-transform duration-[30s] animate-[slow-zoom_40s_infinite_alternate]"
          style={{ backgroundImage: 'url(https://picsum.photos/seed/void-nebula/1920/1080)' }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-transparent to-slate-950"></div>
        <div className="absolute inset-0 void-flux opacity-60"></div>
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-2xl animate-in fade-in zoom-in duration-300">
          <div className="glass p-12 rounded-[2.5rem] border-red-500/40 max-w-md text-center shadow-[0_0_100px_rgba(239,68,68,0.2)]">
            <div className="w-20 h-20 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-8 text-red-500 text-3xl animate-pulse border border-red-500/30">
              <i className="fas fa-biohazard"></i>
            </div>
            <h3 className="text-3xl font-cinzel text-white mb-4 tracking-widest font-black uppercase">Collapse Timeline?</h3>
            <p className="text-slate-400 mb-10 italic text-sm leading-relaxed font-cinzel">
              "Starting a new expedition will initiate a total singularity collapse. All Echoes and equipment will be unmanifested."
            </p>
            <div className="flex flex-col gap-4">
              <button 
                onClick={onNewGame}
                className="w-full py-5 bg-red-600 hover:bg-red-500 text-white font-black font-cinzel tracking-widest rounded-2xl transition-all shadow-xl active:scale-95 uppercase"
              >
                Execute Collapse
              </button>
              <button 
                onClick={() => { soundService.play('CLICK'); setShowResetConfirm(false); }}
                className="w-full py-5 border border-slate-700 hover:border-slate-500 text-slate-500 hover:text-white font-black font-cinzel tracking-widest rounded-2xl transition-all active:scale-95 uppercase"
              >
                Abort
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Elements */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="absolute top-[15%] left-[10%] w-64 h-64 bg-violet-600/10 blur-[100px] animate-float"></div>
        <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-blue-600/5 blur-[120px] animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-20 flex flex-col items-center">
        <div className="mb-4 text-violet-500/80 font-cinzel tracking-[1.5em] text-[10px] uppercase animate-pulse font-black">Archive Manifest Established</div>
        <h1 className="text-[5rem] md:text-[9rem] font-black font-cinzel text-glow tracking-[0.25em] text-white mb-2 leading-none">
          ECHOES
        </h1>
        <h2 className="text-xl md:text-3xl font-cinzel text-violet-400/80 tracking-[0.8em] mb-16 uppercase italic">
          OF THE VOID
        </h2>

        {saveData.exists && (
          <div className="mb-12 w-80 glass p-6 rounded-3xl border-violet-500/20 shadow-2xl animate-in slide-in-from-bottom-12 duration-1000">
             <div className="flex justify-between items-center mb-5 border-b border-white/5 pb-3">
                <span className="text-[9px] font-black text-violet-400 uppercase tracking-widest font-mono">Neural State</span>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
                   <span className="text-[8px] text-emerald-500 font-bold uppercase font-mono">Synced</span>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-6">
                <div>
                   <div className="text-[9px] text-slate-500 uppercase font-black mb-1 font-mono">Expedition</div>
                   <div className="text-sm font-mono text-white font-bold">{saveData.exp.toLocaleString()} EXP</div>
                </div>
                <div>
                   <div className="text-[9px] text-slate-500 uppercase font-black mb-1 font-mono">Essence</div>
                   <div className="text-sm font-mono text-white font-bold">{saveData.shards.toLocaleString()}</div>
                </div>
             </div>
             <div className="mt-5 text-center text-[7px] text-slate-600 uppercase font-black tracking-[0.2em]">
                Last Signature: {formatDate(saveData.lastSaved)}
             </div>
          </div>
        )}

        <div className="flex flex-col gap-5 w-72">
          <button 
            onClick={onStart}
            className="group relative px-8 py-6 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(139,92,246,0.4)] border-t border-violet-400/30 overflow-hidden"
          >
            <span className="relative z-10 font-cinzel tracking-[0.3em] text-2xl uppercase font-black">
              {saveData.exists ? 'RESUME' : 'INITIATE'}
            </span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          </button>
          
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={onOpenSettings}
              className="px-4 py-4 border border-slate-700 hover:border-violet-500/50 bg-slate-900/40 text-slate-400 hover:text-white font-black rounded-xl transition-all font-cinzel tracking-widest text-[10px] uppercase active:scale-95 hover:bg-violet-900/20"
            >
              System
            </button>
            <button 
              onClick={() => { soundService.play('CLICK'); setShowResetConfirm(true); }}
              className="px-4 py-4 border border-slate-700 hover:border-red-500/50 bg-slate-900/40 text-slate-500 hover:text-red-400 font-black rounded-xl transition-all font-cinzel tracking-widest text-[10px] uppercase active:scale-95 hover:bg-red-950/20"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-12 flex flex-col items-center gap-2 z-20 opacity-40 hover:opacity-100 transition-opacity duration-500">
        <div className="text-slate-600 font-cinzel tracking-[0.5em] text-[10px] uppercase font-black">VoidWorks Global &copy; 2025</div>
        <div className="h-px w-32 bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
        <div className="text-slate-500 font-cinzel tracking-[0.2em] text-[8px] uppercase">
          Engineered with <span className="text-violet-400 font-bold">Gemini 3.0</span>
        </div>
      </div>

      <div className="scanline"></div>

      <style>{`
        @keyframes slow-zoom {
          from { transform: scale(1); }
          to { transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
};

export default TitleScreen;
