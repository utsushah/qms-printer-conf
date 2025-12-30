import React, { ReactNode } from 'react';
import Header from './Header';

interface PageContainerProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

const PageContainer: React.FC<PageContainerProps> = ({ 
  children, 
  title, 
  showBack = false, 
  onBack 
}) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header title={title} showBack={showBack} onBack={onBack} />
      <main className="flex-1 p-4 pb-8 max-w-2xl mx-auto w-full">
        <div className="space-y-4 slide-up">
          {children}
        </div>
      </main>
    </div>
  );
};

export default PageContainer;
