
import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onComplete, 800);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-md transition-opacity duration-700 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
      {/* Constrained container - max 750px for elegance as requested */}
      <div className={`relative w-[min(750px,85vw)] aspect-[1350/1080] flex flex-col items-center justify-center animate-fade-in-up ${isExiting ? 'scale-95 blur-sm' : 'scale-100'} transition-all duration-700`}>
        <img
          src="/splash.png"
          alt="PanelCraft Splash"
          className="w-full h-full object-contain drop-shadow-[0_25px_50px_rgba(0,0,0,0.8)]"
        />

        {/* Progress Bar (Discreetly hovering below the artwork) */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[200px] h-[3px] bg-white/10 rounded-full overflow-hidden border border-white/5">
          <div className="h-full bg-brand-cyan shadow-[0_0_10px_#00B5E2] animate-progress" />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        .animate-fade-in-up {
          animation: fade-in-up 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-progress {
          animation: progress 3.8s linear forwards;
        }
      `}} />
    </div>
  );
};

export default SplashScreen;
