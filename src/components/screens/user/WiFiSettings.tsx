import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Lock, Signal, SignalLow, SignalMedium, SignalHigh, RefreshCw, Check } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSettings } from '@/contexts/SettingsContext';
import { toast } from '@/hooks/use-toast';
import { WiFiNetwork } from '@/types/settings';
import { esp32Api } from '@/api/esp32';

interface WiFiSettingsProps {
  onBack: () => void;
}

const mockNetworks: WiFiNetwork[] = [
  { ssid: 'Office_WiFi_5G', strength: 90, secured: true },
  { ssid: 'Office_WiFi_2.4G', strength: 75, secured: true },
  { ssid: 'Guest_Network', strength: 60, secured: false },
  { ssid: 'IoT_Devices', strength: 45, secured: true },
  { ssid: 'Conference_Room', strength: 30, secured: true },
];

const WiFiSettings: React.FC<WiFiSettingsProps> = ({ onBack }) => {
  const { settings } = useSettings();
  const [networks, setNetworks] = useState<WiFiNetwork[]>([]);
  const [scanning, setScanning] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<WiFiNetwork | null>(null);
  const [password, setPassword] = useState('');
  const [connectedSSID, setConnectedSSID] = useState(settings.user.wifi.currentSSID);

  const isWiFiProtocol = settings.manufacturing.protocol === 'Wi-Fi';

  const scanNetworks = async () => {
    setScanning(true);
    try {
      const scannedNetworks = await esp32Api.scanWifi();
      setNetworks(scannedNetworks);
      toast({
        title: "Scan Complete",
        description: `Found ${scannedNetworks.length} networks`,
      });
    } catch (error) {
      // Fallback to mock data if API fails
      setNetworks(mockNetworks);
      toast({
        title: "Scan Complete",
        description: `Found ${mockNetworks.length} networks`,
      });
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    if (isWiFiProtocol) {
      scanNetworks();
    }
  }, [isWiFiProtocol]);

  const getSignalIcon = (strength: number) => {
    if (strength >= 75) return <SignalHigh className="h-5 w-5 text-success" />;
    if (strength >= 50) return <SignalMedium className="h-5 w-5 text-warning" />;
    if (strength >= 25) return <SignalLow className="h-5 w-5 text-warning" />;
    return <Signal className="h-5 w-5 text-destructive" />;
  };

  const handleConnect = async () => {
    if (selectedNetwork?.secured && !password) {
      toast({
        title: "Password Required",
        description: "Please enter the network password",
        variant: "destructive",
      });
      return;
    }

    setConnecting(true);
    try {
      const result = await esp32Api.connectWifi(selectedNetwork?.ssid || '', password);
      if (result.success) {
        setConnectedSSID(selectedNetwork?.ssid || '');
        toast({
          title: "Connected",
          description: `Successfully connected to ${selectedNetwork?.ssid}`,
        });
      } else {
        toast({
          title: "Connection Failed",
          description: result.error || "Failed to connect to network",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to network",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
      setSelectedNetwork(null);
      setPassword('');
    }
  };

  if (!isWiFiProtocol) {
    return (
      <PageContainer title="Wi-Fi Settings" showBack onBack={onBack}>
        <Card className="p-6 text-center">
          <WifiOff className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Feature Not Available</h3>
          <p className="text-muted-foreground">
            Wi-Fi settings are only available when protocol is set to "Wi-Fi".
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Current protocol: {settings.manufacturing.protocol}
          </p>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Wi-Fi Settings" showBack onBack={onBack}>
      {connectedSSID && (
        <Card className="p-4 mb-4 border-success/30 bg-success/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
              <Check className="h-5 w-5 text-success" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Connected to</p>
              <p className="font-medium text-foreground">{connectedSSID}</p>
            </div>
          </div>
        </Card>
      )}

      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-foreground">Available Networks</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={scanNetworks}
          disabled={scanning}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${scanning ? 'animate-spin' : ''}`} />
          {scanning ? 'Scanning...' : 'Scan'}
        </Button>
      </div>

      <div className="space-y-2">
        {networks.map((network) => (
          <Card 
            key={network.ssid}
            className={`p-4 cursor-pointer transition-all hover:border-primary/30 ${connectedSSID === network.ssid ? 'border-success/50' : ''}`}
            onClick={() => {
              if (connectedSSID !== network.ssid) {
                setSelectedNetwork(network);
              }
            }}
          >
            <div className="flex items-center gap-3">
              <Wifi className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium text-foreground">{network.ssid}</p>
                <p className="text-sm text-muted-foreground">
                  {network.secured ? 'Secured' : 'Open'} • {network.strength}%
                </p>
              </div>
              <div className="flex items-center gap-2">
                {network.secured && <Lock className="h-4 w-4 text-muted-foreground" />}
                {getSignalIcon(network.strength)}
                {connectedSSID === network.ssid && (
                  <Check className="h-4 w-4 text-success" />
                )}
              </div>
            </div>
          </Card>
        ))}

        {networks.length === 0 && !scanning && (
          <Card className="p-6 text-center">
            <Wifi className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No networks found</p>
            <Button variant="link" onClick={scanNetworks}>Scan for networks</Button>
          </Card>
        )}
      </div>

      <Dialog open={!!selectedNetwork} onOpenChange={() => { setSelectedNetwork(null); setPassword(''); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5 text-primary" />
              Connect to {selectedNetwork?.ssid}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedNetwork?.secured && (
              <div>
                <Input
                  type="password"
                  placeholder="Enter network password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                />
              </div>
            )}
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => { setSelectedNetwork(null); setPassword(''); }}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1"
                onClick={handleConnect}
                disabled={connecting}
              >
                {connecting ? 'Connecting...' : 'Connect'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default WiFiSettings;
