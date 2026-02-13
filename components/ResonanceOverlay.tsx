import React, { useState, useEffect } from 'react';
import { soundService } from '../services/soundService';

interface ResonanceOverlayProps {
  onComplete: (taps: number) => void;
}

const ResonanceOverlay: React.FC<ResonanceOverlayProps> = ({ onComplete }) => {
  const [taps, setTaps] = useState(0);
  const [timeLeft, setTimeLeft] = useState(8);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          clearInterval(timer);
          onComplete(taps);
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [taps, onComplete]);

  return (
    <div className="fixed inset-0 z-[600] bg-violet-950/40 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
      {/* Visual background pulse */}
      <div className="absolute inset-0 bg-radial-gradient from-violet-500/10 to-transparent animate-pulse"></div>

      <div className="glass p-8 md:p-12 rounded-[3rem] border-violet-400/50 flex flex-col items-center animate-in zoom-in duration-300 shadow-[0_0_100px_rgba(139,92,246,0.5)] max-w-sm w-full relative z-10">
        <div className="text-violet-400 font-cinzel font-black tracking-[0.5em] text-[10px] mb-6 uppercase animate-pulse text-center">
          Neural Synchronization Link
        </div>
        
        <div className="relative mb-10">
          <div className="absolute inset-0 bg-violet-500 blur-3xl opacity-30 animate-ping"></div>
          <button 
            onClick={() => { setTaps(t => t + 1); soundService.play('CLICK'); }} 
            className="relative w-32 h-32 md:w-44 md:h-44 bg-white text-violet-950 rounded-full flex flex-col items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.9)] active:scale-90 transition-all border-[6px] border-violet-400 group"
          >
            <span className="text-[10px] font-black uppercase tracking-widest font-cinzel mb-2 group-hover:scale-110 transition-transform">RESONATE</span>
            <span className="text-5xl md:text-6xl font-mono font-black">{taps}</span>
            <div className="absolute -inset-4 border border-white/20 rounded-full animate-ping opacity-20"></div>
          </button>
        </div>

        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-white/10 mb-4 shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-violet-500 via-violet-300 to-white transition-all duration-100" 
            style={{ width: `${(timeLeft / 8) * 100}%` }}
          ></div>
        </div>
        
        <div className="flex flex-col items-center">
            <div className="text-white font-mono text-xl font-bold">{timeLeft.toFixed(1)}s remaining</div>
            <div className="text-violet-400/60 font-cinzel text-[8px] uppercase tracking-widest mt-2">Tap repeatedly to stabilize the archive</div>
        </div>
      </div>
      
      {/* Decorative scanlines specifically for overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] z-[610] bg-[length:100%_4px,3px_100%]"></div>
    </div>
  );
};

export default ResonanceOverlay;