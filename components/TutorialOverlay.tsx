
import React, { useState } from 'react';

interface TutorialOverlayProps {
  onComplete: () => void;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Welcome, Traveler",
      text: "You are the commander of the Echoes, a band of heroes fighting back the encroaching Void.",
      icon: "fa-compass"
    },
    {
      title: "The World Map",
      text: "Explore 20 stages across the realm. Each victory unlocks the next location. Bosses await at every 5th stage.",
      icon: "fa-map"
    },
    {
      title: "Tactical Combat",
      text: "Combat is turn-based. Heroes go first, then enemies. Manage your HP and use skills wisely.",
      icon: "fa-sword"
    },
    {
      title: "Hero Skills",
      text: "Kaelen is your balanced warrior. Lyra provides heavy magic damage. Synergy is key to survival.",
      icon: "fa-sparkles"
    }
  ];

  const next = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
      <div className="max-w-xl w-full glass p-8 rounded-3xl border-violet-500/30 flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-violet-600/20 rounded-full flex items-center justify-center mb-6 text-violet-400 text-3xl">
          <i className={`fas ${steps[step].icon}`}></i>
        </div>
        
        <h2 className="text-3xl font-cinzel text-white mb-4 tracking-widest">{steps[step].title}</h2>
        <p className="text-slate-300 mb-10 leading-relaxed text-lg italic">
          "{steps[step].text}"
        </p>

        <div className="flex gap-2 mb-8">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-violet-500' : 'w-2 bg-slate-800'}`}></div>
          ))}
        </div>

        <button 
          onClick={next}
          className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white font-black font-cinzel tracking-widest rounded-xl transition-all active:scale-95"
        >
          {step === steps.length - 1 ? "BEGIN EXPEDITION" : "NEXT"}
        </button>
      </div>
    </div>
  );
};

export default TutorialOverlay;
