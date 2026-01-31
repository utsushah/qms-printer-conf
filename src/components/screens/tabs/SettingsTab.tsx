import React, { useState } from 'react';
import { Settings, Factory, Lock } from 'lucide-react';
import MenuCard from '@/components/layout/MenuCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface SettingsTabProps {
  onNavigate: (screen: string) => void;
}

const MANUFACTURING_PASSWORD = '1234';

const SettingsTab: React.FC<SettingsTabProps> = ({ onNavigate }) => {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleManufacturingAccess = () => {
    if (password === MANUFACTURING_PASSWORD) {
      setShowPasswordDialog(false);
      setPassword('');
      setError('');
      onNavigate('manufacturing');
      toast({
        title: "Access Granted",
        description: "Welcome to Manufacturing Settings",
      });
    } else {
      setError('Incorrect password');
      toast({
        title: "Access Denied",
        description: "Incorrect password. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4">
      <div className="space-y-3">
        <MenuCard
          icon={Settings}
          title="User Settings"
          description="Language, Receipt, WiFi and more"
          onClick={() => onNavigate('user')}
        />
        
        <MenuCard
          icon={Factory}
          title="Manufacturing Settings"
          description="Service, Display, Protocol configuration"
          onClick={() => setShowPasswordDialog(true)}
          badge="Protected"
        />
      </div>

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Manufacturing Access
            </DialogTitle>
            <DialogDescription>
              Enter the manufacturing password to access protected settings.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleManufacturingAccess()}
              className={error ? 'border-destructive' : ''}
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowPasswordDialog(false);
                  setPassword('');
                  setError('');
                }}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1"
                onClick={handleManufacturingAccess}
              >
                Access
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsTab;
