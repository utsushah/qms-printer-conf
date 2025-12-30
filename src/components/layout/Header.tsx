import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import equeueLogo from '@/assets/equeue_logo.png';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, showBack = false, onBack }) => {
  return (
    <header className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 z-50 shadow-sm">
      {showBack && (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onBack}
          className="text-primary hover:bg-primary/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}
      <div className="flex items-center gap-3 flex-1">
        <img src={equeueLogo} alt="eQueue" className="h-8" />
        {title && (
          <>
            <div className="w-px h-6 bg-border" />
            <h1 className="text-lg font-semibold text-foreground">{title}</h1>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
