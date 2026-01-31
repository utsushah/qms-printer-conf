import React, { useState } from 'react';
import { Settings, Factory, Lock } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import MenuCard from '@/components/layout/MenuCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { esp32Api } from '@/api/esp32';

interface MainMenuProps {
  onNavigate: (screen: string) => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onNavigate }) => {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleManufacturingAccess = async () => {
    if (!password.trim()) {
      setError('Please enter password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await esp32Api.verifyManufacturingAccess(password.trim());
      
      if (response.success) {
        setShowPasswordDialog(false);
        setPassword('');
        onNavigate('manufacturing');
        toast({
          title: "Access Granted",
          description: "Welcome to Manufacturing Settings",
        });
      } else {
        setError(response.error || 'Incorrect password');
        toast({
          title: "Access Denied",
          description: response.error || "Incorrect password. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      setError('Unable to verify access');
      toast({
        title: "Connection Error",
        description: "Unable to connect to the device.",
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  return (
    <PageContainer title="Settings">
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
                disabled={loading}
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
                disabled={loading}
                onClick={handleManufacturingAccess}
              >
                {loading ? 'Verifying...' : 'Access'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default MainMenu;
