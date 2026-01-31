import React, { useState } from 'react';
import { Settings, FileText, LogOut } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import SettingsTab from './tabs/SettingsTab';
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

interface HomePageProps {
  onNavigate: (screen: string) => void;
  onLogout: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate, onLogout }) => {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/equeue_logo.png" 
              alt="eQueue Logo" 
              className="w-8 h-8"
            />
            <h1 className="text-lg font-semibold text-foreground">QMS Printer</h1>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setShowLogoutDialog(true)}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="w-full rounded-none border-b bg-card h-12">
          <TabsTrigger 
            value="settings" 
            className="flex-1 h-full data-[state=active]:bg-primary/10"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
          <TabsTrigger 
            value="report" 
            className="flex-1 h-full data-[state=active]:bg-primary/10"
          >
            <FileText className="h-4 w-4 mr-2" />
            Report
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="mt-0">
          <SettingsTab onNavigate={onNavigate} />
        </TabsContent>

        <TabsContent value="report" className="mt-0">
          <ReportTab />
        </TabsContent>
      </Tabs>

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
