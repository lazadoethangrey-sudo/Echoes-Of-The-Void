

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
            if (type === 'DODGE') onFinish(true); // Dodge is a success if time runs out without being hit
            else onFinish(false); // Other minigames are failures if time runs out without explicit success
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
  const [soulPos, setSoulPos] = useState({ x: 50, y: 50 }); // Represents the player's controlled 'soul'

  useEffect(() => {
    if (type !== 'DODGE') return;

    const spawnParticle = () => {
        const side = Math.floor(Math.random() * 4); // 0:left, 1:right, 2:top, 3:bottom
        let x = 0, y = 0;
        let vx = 0, vy = 0;

        if (side === 0) { x = -5; y = Math.random() * 100; vx = 0.5 + Math.random(); vy = (Math.random() - 0.5) * 0.5; }
        else if (side === 1) { x = 105; y = Math.random() * 100; vx = -0.5 - Math.random(); vy = (Math.random() - 0.5) * 0.5; }
        else if (side === 2) { x = Math.random() * 100; y = -5; vx = (Math.random() - 0.5) * 0.5; vy = 0.5 + Math.random(); }
        else { x = Math.random() * 100; y = 105; vx = (Math.random() - 0.5) * 0.5; vy = -0.5 - Math.random(); }

        return { id: Math.random(), x, y, vx, vy };
    };

    const particleInterval = setInterval(() => {
      setParticles(prev => {
        const next = prev.map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy }))
          .filter(p => p.x > -10 && p.x < 110 && p.y > -10 && p.y < 110);
        
        if (next.length < 8 && Math.random() < 0.2) { // Spawn new particles
            next.push(spawnParticle());
        }
        return next;
      });
    }, 30);
    return () => clearInterval(particleInterval);
  }, [type]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    if (type === 'DODGE') {
      setSoulPos({ x, y });
      // Collision detection for dodge minigame
      particles.forEach(p => {
        const dist = Math.sqrt(Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2));
        if (dist < 3 && !isGameOver) { // If a particle hits the soul
          setIsGameOver(true);
          soundService.play('DEFEAT');
          onFinish(false); // Minigame failed
        }
      });
    }
  };

  // --- 2. SIGIL ALIGNMENT (Tethering) ---
  const runes = useMemo(() => [ // Left side, fixed order
    { color: '#fbbf24', icon: 'fa-sun' },
    { color: '#60a5fa', icon: 'fa-moon' },
    { color: '#f472b6', icon: 'fa-star' },
    { color: '#c084fc', icon: 'fa-eye' }
  ], []);

  const [shuffledRunes] = useState(() => [...runes].sort(() => Math.random() - 0.5)); // Right side, shuffled
  const [activeRuneIdx, setActiveRuneIdx] = useState<number | null>(null); // Index of rune on left being dragged
  const [matchedRunes, setMatchedRunes] = useState<boolean[]>(runes.map(() => false)); // Tracks matched state for left runes

  const handleRuneSelect = (idx: number) => {
    if (matchedRunes[idx] || activeRuneIdx === idx) return; // Already matched or already selected
    soundService.play('CLICK');
    setActiveRuneIdx(idx);
  };

  const handleTargetRuneClick = (targetIdx: number) => {
    if (activeRuneIdx === null) return; // No left rune selected

    if (runes[activeRuneIdx].icon === shuffledRunes[targetIdx].icon) {
      soundService.play('CLICK');
      setMatchedRunes(prev => {
        const next = [...prev];
        next[activeRuneIdx] = true; // Mark the left rune as matched
        return next;
      });
      // Check for overall success
      if (matchedRunes.filter(m => m).length + 1 === runes.length) { // +1 because state update is async
        setTimeout(() => onFinish(true), 300);
      }
    } else {
      soundService.play('DEFEAT'); // Mismatch sound
      setTimeLeft(t => Math.max(0, t - 1.0)); // Penalty for wrong match
    }
    setActiveRuneIdx(null); // Reset active selection
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
      setRingScale(2.0); // Reset for next tap
      if (next >= 3) onFinish(true); // 3 successes needed
    } else {
      soundService.play('DEFEAT');
      setTimeLeft(t => Math.max(0, t - 1.0));
    }
  };

  // --- 4. VOID PULSE (Timing Click - HARDER) ---
  const [pulseAngle, setPulseAngle] = useState(0); // 0-360 degrees
  const [pulseSuccess, setPulseSuccess] = useState(0);
  const targetAngleRange = 30; // 15 degrees left and right of 0/360
  const clickTolerance = 15; // Degrees from target center

  useEffect(() => {
    if (type !== 'BALANCE') return;
    const interval = setInterval(() => {
      setPulseAngle(prev => (prev + 5) % 360); // Rotates faster (was +2.5)
    }, 20); // Faster updates
    return () => clearInterval(interval);
  }, [type]);

  const handlePulseClick = () => {
    const angleDiff = Math.abs(pulseAngle - 0); // Check against 0/360, as target zone is centered there
    const normalizedDiff = Math.min(angleDiff, 360 - angleDiff);

    if (normalizedDiff <= clickTolerance) {
      soundService.play('CLICK');
      const next = pulseSuccess + 1;
      setPulseSuccess(next);
      if (next >= 2) onFinish(true); // 2 successes needed
    } else {
      soundService.play('DEFEAT');
      setTimeLeft(t => Math.max(0, t - 1.5)); // More severe penalty for missing (was 0.5)
    }
  };


  // --- 5. CONSTELLATION LINK (Path Follow) ---
  const starData = useMemo(() => [
    { x: 30, y: 30, sequence: 0 }, { x: 70, y: 30, sequence: 1 }, 
    { x: 50, y: 70, sequence: 2 }, { x: 50, y: 15, sequence: 3 }
  ].sort(() => Math.random() - 0.5).map((star, i) => ({ ...star, originalIndex: i })), []); // Store originalIndex to render correctly
  const [linkIdx, setLinkIdx] = useState(0); // Tracks next expected sequence number

  const clickStar = (clickedStar: typeof starData[0]) => {
    if (clickedStar.sequence === linkIdx) {
      soundService.play('CLICK');
      const next = linkIdx + 1;
      setLinkIdx(next);
      if (next === starData.length) onFinish(true);
    } else {
      soundService.play('DEFEAT');
      setLinkIdx(0); // Reset on miss
      setTimeLeft(t => Math.max(0, t - 1.0)); // Penalty for wrong click
    }
  };

  // --- 6. DUAL MATCH (Memory) ---
  const cardTypes = ['fa-bolt', 'fa-fire', 'fa-wind', 'fa-star']; // More distinct card types
  const gameCards = useMemo(() => {
    const pairs = [...cardTypes.slice(0, 2), ...cardTypes.slice(0, 2)]; // Two pairs for 4 cards
    return pairs.map((icon, id) => ({ id, icon, flipped: false, solved: false })).sort(() => Math.random() - 0.5);
  }, []);
  
  const [cards, setCards] = useState(gameCards);
  const [flippedCards, setFlippedCards] = useState<number[]>([]); // Store indices of flipped cards

  useEffect(() => {
    if (flippedCards.length === 2) {
      const [idx1, idx2] = flippedCards;
      if (cards[idx1].icon === cards[idx2].icon) {
        // Match!
        soundService.play('CLICK');
        setCards(prev => prev.map((card, i) => 
          i === idx1 || i === idx2 ? { ...card, solved: true } : card
        ));
        setFlippedCards([]);
      } else {
        // No match, flip back after a delay
        soundService.play('DEFEAT');
        setTimeout(() => {
          setCards(prev => prev.map((card, i) => 
            i === idx1 || i === idx2 ? { ...card, flipped: false } : card
          ));
          setFlippedCards([]);
          setTimeLeft(t => Math.max(0, t - 0.5)); // Small penalty for mismatch
        }, 800);
      }
    }
  }, [flippedCards, cards]);

  useEffect(() => {
    if (cards.every(card => card.solved)) {
      onFinish(true);
    }
  }, [cards, onFinish]);

  const clickCard = (idx: number) => {
    if (cards[idx].flipped || cards[idx].solved || flippedCards.length === 2) return;
    
    soundService.play('CLICK');
    setCards(prev => prev.map((card, i) => 
      i === idx ? { ...card, flipped: true } : card
    ));
    setFlippedCards(prev => [...prev, idx]);
  };

  // --- 7. VOID PURGE (Parasites) ---
  const [parasites, setParasites] = useState(() => Array.from({ length: 4 }, (_, i) => ({ 
    id: i, 
    x: 20 + Math.random() * 60, 
    y: 20 + Math.random() * 60, 
    vx: (Math.random() - 0.5) * 0.8, // Random initial velocity
    vy: (Math.random() - 0.5) * 0.8,
    alive: true 
  })));
  
  // Parasite movement
  useEffect(() => {
    if (type !== 'PURGE') return;
    const movementInterval = setInterval(() => {
      setParasites(prev => prev.map(p => {
        if (!p.alive) return p;

        let nextX = p.x + p.vx;
        let nextY = p.y + p.vy;
        let nextVx = p.vx;
        let nextVy = p.vy;

        // Bounce off walls (relative to 0-100 grid)
        if (nextX < 5 || nextX > 95) nextVx *= -1;
        if (nextY < 5 || nextY > 95) nextVy *= -1;

        return { ...p, x: nextX, y: nextY, vx: nextVx, vy: nextVy };
      }));
    }, 50); // Update position frequently
    return () => clearInterval(movementInterval);
  }, [type]);

  const killParasite = (id: number) => {
    soundService.play('CLICK');
    setParasites(prev => {
      const next = prev.map(p => p.id === id ? { ...p, alive: false } : p);
      if (next.every(p => !p.alive)) {
        setTimeout(() => onFinish(true), 300);
      }
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
          onMouseMove={type === 'DODGE' ? handleMouseMove : undefined}
          className="w-80 h-80 relative bg-slate-900/50 border-2 border-violet-500/20 rounded-3xl overflow-hidden shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]"
        >
            {/* VOID PULSE (HARDER) */}
            {type === 'BALANCE' && (
              <button onClick={handlePulseClick} className="w-full h-full flex flex-col items-center justify-center gap-8 group relative">
                {/* Visualizer for pulseAngle */}
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-8 border-violet-500/20"></div>
                  <div className="absolute inset-4 rounded-full border-4 border-dashed border-violet-400/40 animate-[spin_10s_linear_infinite]"></div>
                  
                  {/* Target success zone (centered at 0 degrees) */}
                  <div 
                    className="absolute w-24 h-24 bg-emerald-500/20 rounded-full"
                    style={{ 
                      clipPath: `polygon(50% 50%, 50% 0%, ${50 + Math.sin((targetAngleRange / 2) * Math.PI / 180) * 50}% ${50 - Math.cos((targetAngleRange / 2) * Math.PI / 180) * 50}%, ${50 + Math.sin((-targetAngleRange / 2) * Math.PI / 180) * 50}% ${50 - Math.cos((-targetAngleRange / 2) * Math.PI / 180) * 50}%, 50% 0%)`,
                      transform: `rotate(${-targetAngleRange / 2}deg)` // Center the success zone at the top
                    }}
                  ></div>

                  {/* Rotating Indicator */}
                  <div 
                    className="absolute origin-bottom w-1 h-24 bg-white rounded-full transition-transform duration-75" 
                    style={{ transform: `translateX(-50%) rotate(${pulseAngle}deg)` }}
                  ></div>
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
                 {starData.map((star, i) => (
                   <button 
                     key={i} 
                     onClick={() => clickStar(star)} 
                     className={`absolute w-12 h-12 rounded-full border-2 transition-all flex items-center justify-center ${star.sequence < linkIdx ? 'bg-amber-500 border-white text-white scale-90' : star.sequence === linkIdx ? 'border-amber-400 animate-pulse bg-amber-400/20 text-white' : 'border-slate-800 text-slate-700'}`}
                     style={{ left: `${star.x}%`, top: `${star.y}%`, transform: 'translate(-50%, -50%)' }}
                   >
                     <i className="fas fa-star text-lg"></i>
                     <span className="absolute -top-6 text-[10px] font-bold">{star.sequence + 1}</span>
                   </button>
                 ))}
              </div>
            )}

            {/* DUAL MEMORY */}
            {type === 'MATCH' && (
              <div className="w-full h-full grid grid-cols-2 gap-4 p-8">
                {cards.map((card, i) => {
                  const isVisible = card.flipped || card.solved;
                  return (
                    <button 
                      key={i} 
                      onClick={() => clickCard(i)}
                      className={`aspect-square rounded-2xl border-2 transition-all flex items-center justify-center text-3xl ${isVisible ? 'bg-violet-600 border-white text-white' : 'bg-slate-950 border-slate-800 text-transparent'}`}
                      disabled={card.solved || flippedCards.length === 2}
                    >
                      <i className={`fas ${card.icon}`}></i>
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
                   <button key={p.id} onClick={() => killParasite(p.id)} className="absolute group" style={{ left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%, -50%) scale(1.2)' }}>
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
                     <button 
                       key={i} 
                       onClick={() => handleRuneSelect(i)} 
                       className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all ${matchedRunes[i] ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : activeRuneIdx === i ? 'bg-violet-600 border-white text-white scale-110' : 'bg-slate-950 border-slate-700 text-slate-500'}`} 
                       style={{ color: matchedRunes[i] ? '#10b981' : r.color }}
                     >
                       <i className={`fas ${r.icon} text-lg`}></i>
                     </button>
                   ))}
                 </div>
                 <div className="flex-1 relative">
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      {runes.map((r, i) => matchedRunes[i] && (
                        <line 
                          key={i} 
                          x1="0%" 
                          y1={`${((i * 100) / runes.length) + (100 / (runes.length * 2))}%`} 
                          x2="100%" 
                          y2={`${((shuffledRunes.findIndex(sr => sr.icon === r.icon) * 100) / shuffledRunes.length) + (100 / (shuffledRunes.length * 2))}%`} 
                          stroke={r.color} 
                          strokeWidth="3" 
                          opacity="0.6" 
                        />
                      ))}
                    </svg>
                 </div>
                 <div className="flex flex-col justify-around">
                   {shuffledRunes.map((r, i) => {
                     const isTargetMatched = matchedRunes.some((m, idx) => m && runes[idx].icon === r.icon);
                     return (
                       <button 
                         key={i} 
                         onClick={() => handleTargetRuneClick(i)} 
                         disabled={!activeRuneIdx && activeRuneIdx !== 0} // Disable if no left rune selected
                         className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all ${isTargetMatched ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-700 text-slate-500'}`} 
                         style={{ color: isTargetMatched ? '#10b981' : r.color }}
                       >
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
            {type === 'BALANCE' && 'Click when the indicator is in the green zone'}
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