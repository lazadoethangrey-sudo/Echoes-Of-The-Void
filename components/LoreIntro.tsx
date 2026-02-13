import React, { useState, useEffect } from 'react';

interface LoreIntroProps {
  onComplete: () => void;
}

const LoreIntro: React.FC<LoreIntroProps> = ({ onComplete }) => {
  const [currentLine, setCurrentLine] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const lines = [
    "In the cycle of the Great Singularity...",
    "The first thread of reality was pulled.",
    "A silence spread across the stars, deeper than any night.",
    "Worlds did not burn. They simply... ceased to be.",
    "But from the echoes of collapsed timelines,",
    "A final resistance was manifest.",
    "Synchronized by the resonance of the Void,",
    "The Echoes have arrived to reclaim the Archive.",
    "Commander...",
    "The Singularity is watching."
  ];

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentLine(prev => {
        if (prev >= lines.length - 1) {
          clearInterval(interval);
          setTimeout(onComplete, 3000);
          return prev;
        }
        return prev + 1;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div 
      className="fixed inset-0 z-[500] bg-black flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden cursor-pointer"
      onClick={() => {
        if (currentLine < lines.length - 1) {
          setCurrentLine(prev => prev + 1);
        } else {
          onComplete();
        }
      }}
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-radial-gradient from-violet-900/5 via-transparent to-transparent opacity-50 blur-[100px]"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none"></div>

      {/* Skip Button */}
      <button 
        onClick={(e) => { e.stopPropagation(); onComplete(); }}
        className="absolute top-8 right-8 z-[510] px-6 py-2 border border-white/10 text-white/40 hover:text-white hover:border-white/40 transition-all font-cinzel text-[10px] tracking-widest uppercase rounded-full bg-black/40 backdrop-blur-md"
      >
        Skip Transmission
      </button>

      {/* Lore Content */}
      <div className="relative z-10 max-w-2xl w-full text-center space-y-4">
        <div className="text-violet-500/30 font-mono text-[8px] uppercase tracking-[0.5em] mb-12 animate-pulse">
          // Neural Synchronization Link Established
        </div>

        <div className="relative min-h-[120px] flex items-center justify-center">
          {lines.map((line, idx) => (
            <p 
              key={idx}
              className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 font-cinzel text-xl md:text-3xl lg:text-4xl text-white tracking-widest leading-relaxed text-glow ${
                idx === currentLine ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              {line}
            </p>
          ))}
        </div>

        <div className="pt-24 opacity-20 text-white font-mono text-[8px] uppercase tracking-widest animate-bounce">
          Tap to proceed
        </div>
      </div>

      {/* CRT Scanlines Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] z-[520] bg-[length:100%_4px,3px_100%]"></div>
    </div>
  );
};

export default LoreIntro;