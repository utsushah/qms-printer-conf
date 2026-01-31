import React, { useState } from 'react';
import { Settings, FileText, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SettingsTab from './tabs/SettingsTab';
import equeueLogo from '@/assets/equeue_logo.png';
import ReportTab from './tabs/ReportTab';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

interface HomePageProps {
  onNavigate: (screen: string) => void;
  onLogout: () => void;
}

type TabType = 'settings' | 'report';

const HomePage: React.FC<HomePageProps> = ({ onNavigate, onLogout }) => {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('settings');

  const tabs = [
    { id: 'settings' as TabType, label: 'Settings', icon: Settings },
    { id: 'report' as TabType, label: 'Report', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - matching settings page style */}
      <header className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 z-50 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3 flex-1">
          <img src={equeueLogo} alt="eQueue" className="h-8" />
          <div className="w-px h-6 bg-border" />
          <h1 className="text-lg font-semibold text-foreground">QMS Printer</h1>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setShowLogoutDialog(true)}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      {/* Tab Navigation - Centered */}
      <div className="bg-card border-b border-border flex-shrink-0">
        <div className="flex justify-center gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all relative",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'settings' && <SettingsTab onNavigate={onNavigate} />}
        {activeTab === 'report' && <ReportTab />}
      </div>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onLogout}>
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default HomePage;
