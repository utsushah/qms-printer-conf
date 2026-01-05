import React, { useState } from 'react';
import { 
  Settings2, 
  Radio, 
  Monitor, 
  Printer, 
  Network, 
  Upload,
  RotateCcw
} from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import MenuCard from '@/components/layout/MenuCard';
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
import { esp32Api } from '@/api/esp32';
import { useToast } from '@/hooks/use-toast';

interface ManufacturingMenuProps {
  onNavigate: (screen: string) => void;
  onBack: () => void;
}

const ManufacturingMenu: React.FC<ManufacturingMenuProps> = ({ onNavigate, onBack }) => {
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetting, setResetting] = useState(false);
  const { toast } = useToast();

  const handleFactoryReset = async () => {
    setResetting(true);
    try {
      await esp32Api.factoryReset();
      toast({
        title: "Factory Reset Complete",
        description: "All settings have been reset to defaults. Device will restart.",
      });
      setShowResetDialog(false);
    } catch (error) {
      toast({
        title: "Reset Failed",
        description: "Failed to reset device. Please try again.",
        variant: "destructive",
      });
    } finally {
      setResetting(false);
    }
  };

  return (
    <PageContainer title="Manufacturing Settings" showBack onBack={onBack}>
      <div className="space-y-3">
        <MenuCard
          icon={Settings2}
          title="Service Setting"
          description="Model type & active services"
          onClick={() => onNavigate('mfg-service')}
        />
        
        <MenuCard
          icon={Radio}
          title="Remote Setting"
          description="Remote ID & service code"
          onClick={() => onNavigate('mfg-remote')}
        />
        
        <MenuCard
          icon={Monitor}
          title="Display Setting"
          description="Counter & waiting area displays"
          onClick={() => onNavigate('mfg-display')}
        />
        
        <MenuCard
          icon={Printer}
          title="Printer Setting"
          description="Device model & copies"
          onClick={() => onNavigate('mfg-printer')}
        />
        
        <MenuCard
          icon={Network}
          title="Protocol Setting"
          description="Wi-Fi, LAN or RS485"
          onClick={() => onNavigate('mfg-protocol')}
        />
        
        <MenuCard
          icon={Upload}
          title="Software Update"
          description="Upload firmware update"
          onClick={() => onNavigate('mfg-update')}
        />

        <MenuCard
          icon={RotateCcw}
          title="Factory Reset"
          description="Reset all settings to defaults"
          onClick={() => setShowResetDialog(true)}
        />
      </div>

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Factory Reset</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all settings to factory defaults. This action cannot be undone. The device will restart after reset.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleFactoryReset}
              disabled={resetting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {resetting ? 'Resetting...' : 'Reset'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
};

export default ManufacturingMenu;
