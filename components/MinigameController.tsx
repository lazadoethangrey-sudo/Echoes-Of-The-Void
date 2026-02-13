
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MinigameType } from '../types';
import { soundService } from '../services/soundService';

interface MinigameControllerProps {
  type: MinigameType;
  onFinish: (success: boolean) => void;
}

const MinigameController: React.FC<MinigameControllerProps> = ({ type, onFinish }) => {
  const [timeLeft, setTimeLeft] = useState(type === 'DODGE' ? 14 : 12);
  const [isGameOver, setIsGameOver] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 0.1) {
          clearInterval(timer);
          if (!isGameOver) {
            if (type === 'DODGE') onFinish(true);
            else onFinish(false);
          }
          return 0;
        }
        return Math.max(0, t - 0.1);
      });
    }, 100);
    return () => clearInterval(timer);
  }, [type, onFinish, isGameOver]);

  // --- 1. SOUL SHIELDING (Dodge) ---
  const [particles, setParticles] = useState<{ x: number, y: number, vx: number, vy: number, id: number }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [soulPos, setSoulPos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    if (type !== 'DODGE') return;
    const interval = setInterval(() => {
      setParticles(prev => {
        const next = prev.map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy }))
          .filter(p => p.x > -10 && p.x < 110 && p.y > -10 && p.y < 110);
        
        if (next.length < 6) {
          const side = Math.floor(Math.random() * 4);
          let x = 0, y = 0;
          if (side === 0) { x = -5; y = Math.random() * 100; }
          else if (side === 1) { x = 105; y = Math.random() * 100; }
          else if (side === 2) { x = Math.random() * 100; y = -5; }
          else { x = Math.random() * 100; y = 105; }

          next.push({
            id: Math.random(),
            x, y,
            vx: (50 - x) * 0.003 + (Math.random() - 0.5) * 0.4,
            vy: (50 - y) * 0.003 + (Math.random() - 0.5) * 0.4
          });
        }
        return next;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [type]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    if (type === 'DODGE') {
      setSoulPos({ x, y });
      particles.forEach(p => {
        const dist = Math.sqrt(Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2));
        if (dist < 3) {
          setIsGameOver(true);
          soundService.play('DEFEAT');
          onFinish(false);
        }
      });
    }
  };

  // --- 2. SIGIL ALIGNMENT (Tethering) ---
  const runes = useMemo(() => [
    { color: '#fbbf24', icon: 'fa-sun' },
    { color: '#60a5fa', icon: 'fa-moon' },
    { color: '#f472b6', icon: 'fa-star' },
    { color: '#c084fc', icon: 'fa-eye' }
  ].sort(() => Math.random() - 0.5), []);

  const [tethers, setTethers] = useState<{ runeIdx: number, matched: boolean }[]>(
    runes.map((_, i) => ({ runeIdx: i, matched: false }))
  );
  const [shuffledRunes] = useState(() => [...runes].sort(() => Math.random() - 0.5));
  const [activeRune, setActiveRune] = useState<number | null>(null);

  const connectRune = (leftIdx: number, rightIdx: number) => {
    if (runes[leftIdx].icon === shuffledRunes[rightIdx].icon) {
      soundService.play('CLICK');
      const nextTethers = [...tethers];
      nextTethers[leftIdx].matched = true;
      setTethers(nextTethers);
      if (nextTethers.every(t => t.matched)) setTimeout(() => onFinish(true), 300);
    }
    setActiveRune(null);
  };

  // --- 3. RHYTHM ECHO (Timing Tap) ---
  const [ringScale, setRingScale] = useState(2.0);
  const [rhythmSuccesses, setRhythmSuccesses] = useState(0);
  const targetScale = 0.4;

  useEffect(() => {
    if (type !== 'RHYTHM') return;
    const interval = setInterval(() => {
      setRingScale(s => s <= 0.2 ? 2.0 : s - 0.02);
    }, 20);
    return () => clearInterval(interval);
  }, [type]);

  const handleRhythmTap = () => {
    const diff = Math.abs(ringScale - targetScale);
    if (diff < 0.2) { // Increased window
      soundService.play('CLICK');
      const next = rhythmSuccesses + 1;
      setRhythmSuccesses(next);
      setRingScale(2.0);
      if (next >= 3) onFinish(true);
    } else {
      setTimeLeft(t => Math.max(0, t - 1.0));
    }
  };

  // --- 4. VOID PULSE (Replaces Balance - Easy Timing) ---
  const [pulseScale, setPulseScale] = useState(1.0);
  const [pulseSuccess, setPulseSuccess] = useState(0);

  useEffect(() => {
    if (type !== 'BALANCE') return;
    const interval = setInterval(() => {
      setPulseScale(s => 1 + Math.sin(Date.now() / 250) * 0.5);
    }, 20);
    return () => clearInterval(interval);
  }, [type]);

  const handlePulseClick = () => {
    // Large window for "WAY easier" gameplay
    if (pulseScale > 1.25) {
      soundService.play('CLICK');
      const next = pulseSuccess + 1;
      setPulseSuccess(next);
      if (next >= 2) onFinish(true);
    } else {
      setTimeLeft(t => Math.max(0, t - 0.5));
    }
  };

  // --- 5. CONSTELLATION LINK (Path Follow) ---
  const starCoords = useMemo(() => [
    { x: 30, y: 30 }, { x: 70, y: 30 }, { x: 50, y: 70 }, { x: 50, y: 15 }
  ].sort(() => Math.random() - 0.5), []);
  const [linkIdx, setLinkIdx] = useState(0);

  const clickStar = (idx: number) => {
    if (idx === linkIdx) {
      soundService.play('CLICK');
      const next = idx + 1;
      setLinkIdx(next);
      if (next === starCoords.length) onFinish(true);
    } else {
      setLinkIdx(0); // Reset on miss
    }
  };

  // --- 6. DUAL MATCH (Memory) ---
  const cardTypes = ['fa-bolt', 'fa-fire', 'fa-bolt', 'fa-fire'];
  const shuffledCards = useMemo(() => [...cardTypes].sort(() => Math.random() - 0.5), []);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [solved, setSolved] = useState<number[]>([]);

  const clickCard = (idx: number) => {
    if (flipped.length < 2 && !flipped.includes(idx) && !solved.includes(idx)) {
      soundService.play('CLICK');
      const nextFlipped = [...flipped, idx];
      setFlipped(nextFlipped);
      
      if (nextFlipped.length === 2) {
        if (shuffledCards[nextFlipped[0]] === shuffledCards[nextFlipped[1]]) {
          setSolved(s => {
            const next = [...s, ...nextFlipped];
            if (next.length === 4) setTimeout(() => onFinish(true), 500);
            return next;
          });
          setFlipped([]);
        } else {
          setTimeout(() => setFlipped([]), 800);
        }
      }
    }
  };

  // --- 7. VOID PURGE (Parasites) ---
  const [parasites, setParasites] = useState(() => Array.from({ length: 4 }, (_, i) => ({ id: i, x: 20 + Math.random() * 60, y: 20 + Math.random() * 60, alive: true })));
  const killParasite = (id: number) => {
    soundService.play('CLICK');
    setParasites(prev => {
      const next = prev.map(p => p.id === id ? { ...p, alive: false } : p);
      if (next.every(p => !p.alive)) setTimeout(() => onFinish(true), 300);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-950/90 backdrop-blur-2xl animate-in fade-in duration-500">
      <div className="max-w-xl w-full glass p-10 rounded-[3rem] border-violet-500/30 relative overflow-hidden flex flex-col items-center">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-violet-400 to-transparent"></div>
        
        <header className="mb-8 text-center relative z-10">
          <div className="text-violet-400 font-black font-cinzel text-[10px] tracking-[0.4em] uppercase mb-2 animate-pulse">Signature Echo Resonance</div>
          <h3 className="text-3xl font-cinzel text-white font-black tracking-widest uppercase">
            {type === 'DODGE' && 'Soul Shielding'}
            {type === 'WIRES' && 'Sigil Alignment'}
            {type === 'RHYTHM' && 'Rhythm Echo'}
            {type === 'BALANCE' && 'Void Pulse'}
            {type === 'LINK' && 'Celestial Link'}
            {type === 'MATCH' && 'Dual Memory'}
            {type === 'PURGE' && 'Void Purge'}
          </h3>
          <div className="flex items-center justify-center gap-3 mt-4">
             <div className="h-1.5 w-32 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div className="h-full bg-gradient-to-r from-violet-600 to-blue-400" style={{ width: `${(timeLeft / 12) * 100}%` }}></div>
             </div>
             <span className="text-xs font-mono text-violet-300 font-bold">{timeLeft.toFixed(1)}s</span>
          </div>
        </header>

        <div 
          ref={containerRef}
          onMouseMove={handleMouseMove}
          className="w-80 h-80 relative bg-slate-900/50 border-2 border-violet-500/20 rounded-3xl overflow-hidden shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]"
        >
            {/* VOID PULSE (EASY) */}
            {type === 'BALANCE' && (
              <button onClick={handlePulseClick} className="w-full h-full flex flex-col items-center justify-center gap-8 group">
                <div className="relative w-48 h-48 flex items-center justify-center">
                   <div className="absolute inset-0 rounded-full border-8 border-violet-500/20"></div>
                   <div className="absolute inset-4 rounded-full border-4 border-dashed border-violet-400/40 animate-[spin_10s_linear_infinite]"></div>
                   <div className="absolute inset-8 rounded-full border-2 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]"></div>
                   <div className="w-12 h-12 bg-white rounded-full shadow-[0_0_30px_#fff] transition-transform duration-75" style={{ transform: `scale(${pulseScale * 2})` }}></div>
                </div>
                <div className="flex gap-4">
                   {[...Array(2)].map((_, i) => (
                     <div key={i} className={`w-4 h-4 rounded-full border-2 ${i < pulseSuccess ? 'bg-emerald-500 border-emerald-300' : 'bg-slate-900 border-slate-700'}`}></div>
                   ))}
                </div>
              </button>
            )}

            {/* RHYTHM ECHO */}
            {type === 'RHYTHM' && (
              <button onClick={handleRhythmTap} className="w-full h-full flex flex-col items-center justify-center gap-6 group">
                <div className="relative w-40 h-40 flex items-center justify-center">
                   <div className="absolute inset-0 rounded-full border-4 border-emerald-500/30 transition-transform duration-20" style={{ transform: `scale(${ringScale})` }}></div>
                   <div className="w-16 h-16 rounded-full border-4 border-white shadow-[0_0_20px_#fff]"></div>
                </div>
                <div className="flex gap-2">
                   {[...Array(3)].map((_, i) => (
                     <div key={i} className={`w-3 h-3 rounded-full border ${i < rhythmSuccesses ? 'bg-emerald-500 border-emerald-400' : 'bg-slate-900 border-slate-700'}`}></div>
                   ))}
                </div>
              </button>
            )}

            {/* CELESTIAL LINK */}
            {type === 'LINK' && (
              <div className="w-full h-full relative">
                 {starCoords.map((star, i) => (
                   <button 
                     key={i} 
                     onClick={() => clickStar(i)} 
                     className={`absolute w-12 h-12 rounded-full border-2 transition-all flex items-center justify-center ${i < linkIdx ? 'bg-amber-500 border-white text-white scale-90' : i === linkIdx ? 'border-amber-400 animate-pulse bg-amber-400/20 text-white' : 'border-slate-800 text-slate-700'}`}
                     style={{ left: `${star.x}%`, top: `${star.y}%`, transform: 'translate(-50%, -50%)' }}
                   >
                     <i className="fas fa-star text-lg"></i>
                     <span className="absolute -top-6 text-[10px] font-bold">{i + 1}</span>
                   </button>
                 ))}
              </div>
            )}

            {/* DUAL MEMORY */}
            {type === 'MATCH' && (
              <div className="w-full h-full grid grid-cols-2 gap-4 p-8">
                {shuffledCards.map((icon, i) => {
                  const isVisible = flipped.includes(i) || solved.includes(i);
                  return (
                    <button 
                      key={i} 
                      onClick={() => clickCard(i)}
                      className={`aspect-square rounded-2xl border-2 transition-all flex items-center justify-center text-3xl ${isVisible ? 'bg-violet-600 border-white text-white' : 'bg-slate-950 border-slate-800 text-transparent'}`}
                    >
                      <i className={`fas ${icon}`}></i>
                    </button>
                  );
                })}
              </div>
            )}

            {/* DODGE */}
            {type === 'DODGE' && (
              <div className="w-full h-full cursor-none">
                 <div className="absolute w-6 h-6 flex items-center justify-center z-20" style={{ left: `${soulPos.x}%`, top: `${soulPos.y}%`, transform: 'translate(-50%, -50%)' }}>
                   <div className="absolute inset-0 bg-white blur-md opacity-30 animate-pulse"></div>
                   <i className="fas fa-heart text-white"></i>
                 </div>
                 {particles.map(p => (
                   <div key={p.id} className="absolute w-2 h-2 bg-violet-500 rounded-full shadow-[0_0_8px_rgba(139,92,246,0.8)]" style={{ left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%, -50%)' }}></div>
                 ))}
              </div>
            )}

            {/* PURGE */}
            {type === 'PURGE' && (
              <div className="w-full h-full relative p-8">
                 {parasites.map(p => p.alive && (
                   <button key={p.id} onClick={() => killParasite(p.id)} className="absolute group" style={{ left: `${p.x}%`, top: `${p.y}%`, transform: 'scale(1.2)' }}>
                      <i className="fas fa-spider text-violet-500 text-5xl animate-pulse"></i>
                   </button>
                 ))}
              </div>
            )}

            {/* SIGIL ALIGNMENT */}
            {type === 'WIRES' && (
              <div className="flex justify-between h-full p-6">
                 <div className="flex flex-col justify-around">
                   {runes.map((r, i) => (
                     <button key={i} onMouseDown={() => setActiveRune(i)} className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all ${tethers[i].matched ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : activeRune === i ? 'bg-violet-600 border-white text-white scale-110' : 'bg-slate-950 border-slate-700 text-slate-500'}`} style={{ color: tethers[i].matched ? '#10b981' : r.color }}>
                       <i className={`fas ${r.icon} text-lg`}></i>
                     </button>
                   ))}
                 </div>
                 <div className="flex-1 relative">
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      {tethers.map((t, i) => t.matched && (
                        <line key={i} x1="0" y1={`${(i * 25) + 12.5}%`} x2="100%" y2={`${(shuffledRunes.findIndex(sr => sr.icon === runes[i].icon) * 25) + 12.5}%`} stroke={runes[i].color} strokeWidth="3" opacity="0.6" />
                      ))}
                    </svg>
                 </div>
                 <div className="flex flex-col justify-around">
                   {shuffledRunes.map((r, i) => {
                     const isMatched = tethers.some(t => t.matched && runes[t.runeIdx].icon === r.icon);
                     return (
                       <button key={i} onMouseUp={() => activeRune !== null && connectRune(activeRune, i)} className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all ${isMatched ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-700 text-slate-500'}`} style={{ color: isMatched ? '#10b981' : r.color }}>
                         <i className={`fas ${r.icon} text-lg`}></i>
                       </button>
                     );
                   })}
                 </div>
              </div>
            )}
        </div>

        <footer className="mt-8 text-center relative z-10">
          <p className="text-[10px] text-slate-500 font-cinzel tracking-widest uppercase italic max-w-xs">
            {type === 'RHYTHM' && 'Tap when the rings align'}
            {type === 'BALANCE' && 'Click when the pulse is large'}
            {type === 'LINK' && 'Follow the numbered sequence'}
            {type === 'MATCH' && 'Recall the ancient symbols'}
            {type === 'DODGE' && 'Evade the void fragments'}
            {type === 'PURGE' && 'Clear the parasite infestation'}
          </p>
        </footer>
      </div>
    </div>
  );
};

export default MinigameController;
