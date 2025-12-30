import React, { useState, useEffect } from 'react';
import equeueLogo from '@/assets/equeue_logo.png';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 300);
          return 100;
        }
        return prev + 2;
      });
    }, 40);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center">
      <div className="text-center fade-in">
        <div className="mb-8 pulse-glow inline-block p-6 bg-card rounded-2xl shadow-2xl">
          <img 
            src={equeueLogo} 
            alt="eQueue" 
            className="h-16 mx-auto"
          />
        </div>
        
        <h1 className="text-3xl font-bold text-primary-foreground mb-2">
          QMS Printer Settings
        </h1>
        <p className="text-primary-foreground/80 mb-8">
          Configure your queue management system
        </p>
        
        <div className="w-64 mx-auto">
          <div className="h-2 bg-primary-foreground/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary-foreground rounded-full transition-all duration-100 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-primary-foreground/60 mt-3">
            Loading settings...
          </p>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
