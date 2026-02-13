
import React from 'react';

interface DailyRewardProps {
  onClaim: () => void;
  claimed: boolean;
  totalClaims: number;
}

const DailyReward: React.FC<DailyRewardProps> = ({ onClaim, claimed, totalClaims }) => {
  if (claimed) return null;

  const rewardType = totalClaims % 3; // 0: Shards, 1: Echo, 2: Accessory
  
  const getRewardInfo = () => {
    if (rewardType === 0) return { icon: "fa-gem", color: "text-violet-400", amount: "500", label: "Void Shards" };
    if (rewardType === 1) return { icon: "fa-ticket", color: "text-blue-400", amount: "1", label: "Echo Ticket" };
    return { icon: "fa-ticket-simple", color: "text-violet-400", amount: "1", label: "Accessory Ticket" };
  };

  const info = getRewardInfo();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="max-w-md w-full glass p-8 rounded-3xl border-violet-500/30 flex flex-col items-center text-center animate-in zoom-in duration-300">
        <div className={`w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mb-6 ${info.color} text-4xl animate-bounce border border-amber-500/20`}>
          <i className={`fas ${info.icon}`}></i>
        </div>
        
        <h2 className="text-3xl font-cinzel text-white mb-2 tracking-widest font-black uppercase">DAILY BLESSING</h2>
        <p className="text-slate-400 mb-8 leading-relaxed italic text-sm">
          "The cycle continues. The Void yields essence for your persistence."
        </p>

        <div className="w-full bg-slate-900 border border-slate-800 p-6 rounded-2xl mb-8 flex flex-col items-center">
          <div className="flex items-center gap-3 mb-2">
            <i className={`fas ${info.icon} ${info.color} text-2xl`}></i>
            <span className="text-3xl font-mono font-bold text-white">{info.amount}</span>
          </div>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{info.label} Granted</span>
        </div>

        <button 
          onClick={onClaim}
          className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white font-black font-cinzel tracking-widest rounded-xl transition-all active:scale-95 shadow-[0_0_20px_rgba(139,92,246,0.3)]"
        >
          CLAIM REWARD
        </button>
      </div>
    </div>
  );
};

export default DailyReward;
