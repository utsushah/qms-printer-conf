import React, { useState } from 'react';
import { Wifi, Cable, CircuitBoard, Check } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import SaveButton from '@/components/common/SaveButton';
import { Card } from '@/components/ui/card';
import { useSettings } from '@/contexts/SettingsContext';
import { toast } from '@/hooks/use-toast';
import { ProtocolType } from '@/types/settings';

interface ProtocolSettingProps {
  onBack: () => void;
}

// Custom icons for LAN (RJ45) and RS485
const RJ45Icon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <rect x="4" y="6" width="16" height="12" rx="2" />
    <path d="M8 6V4" />
    <path d="M12 6V4" />
    <path d="M16 6V4" />
    <path d="M8 18v2" />
    <path d="M16 18v2" />
    <rect x="7" y="10" width="10" height="4" />
  </svg>
);

const RS485Icon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <path d="M4 12h4" />
    <path d="M16 12h4" />
    <circle cx="12" cy="12" r="4" />
    <path d="M12 8V4" />
    <path d="M12 20v-4" />
    <path d="M8 8L5 5" />
    <path d="M19 19l-3-3" />
    <path d="M8 16l-3 3" />
    <path d="M19 5l-3 3" />
  </svg>
);

const PROTOCOLS: { type: ProtocolType; label: string; description: string; icon: React.ReactNode }[] = [
  { 
    type: 'Wi-Fi', 
    label: 'Wi-Fi', 
    description: 'Wireless network connection',
    icon: <Wifi className="h-6 w-6" />
  },
  { 
    type: 'LAN', 
    label: 'LAN (Ethernet)', 
    description: 'Wired RJ45 network connection',
    icon: <RJ45Icon />
  },
  { 
    type: 'RS485', 
    label: 'RS485 Serial', 
    description: 'Industrial serial communication',
    icon: <RS485Icon />
  },
];

const ProtocolSetting: React.FC<ProtocolSettingProps> = ({ onBack }) => {
  const { settings, updateProtocol } = useSettings();
  const [protocol, setProtocol] = useState<ProtocolType>(settings.manufacturing.protocol);
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      updateProtocol(protocol);
      setLoading(false);
      toast({
        title: "Settings Saved",
        description: `Protocol changed to ${protocol}`,
      });
    }, 500);
  };

  return (
    <PageContainer title="Protocol Setting" showBack onBack={onBack}>
      <Card className="p-4">
        <h3 className="font-medium text-foreground mb-4">Select Communication Protocol</h3>
        <div className="space-y-3">
          {PROTOCOLS.map(p => (
            <div
              key={p.type}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                protocol === p.type 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/30'
              }`}
              onClick={() => setProtocol(p.type)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    protocol === p.type 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {p.icon}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{p.label}</p>
                    <p className="text-sm text-muted-foreground">{p.description}</p>
                  </div>
                </div>
                {protocol === p.type && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-4">
        <SaveButton onClick={handleSave} loading={loading} />
      </div>
    </PageContainer>
  );
};

export default ProtocolSetting;
