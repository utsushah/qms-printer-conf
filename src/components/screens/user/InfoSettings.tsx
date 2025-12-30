import React from 'react';
import { Cpu, Code, Radio, Network, Printer } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/card';
import { useSettings } from '@/contexts/SettingsContext';

interface InfoSettingsProps {
  onBack: () => void;
}

const InfoSettings: React.FC<InfoSettingsProps> = ({ onBack }) => {
  const { settings } = useSettings();
  const { systemInfo, softwareVersion, protocolType, networkInfo, printerModel } = settings.user.info;
  const showNetworkInfo = protocolType === 'Wi-Fi' || protocolType === 'LAN';

  const infoItems = [
    {
      icon: Cpu,
      label: 'System Info',
      value: systemInfo,
      description: 'Hardware information'
    },
    {
      icon: Code,
      label: 'Software Version',
      value: softwareVersion,
      description: 'Firmware version'
    },
    {
      icon: Radio,
      label: 'Protocol Type',
      value: protocolType,
      description: 'Communication protocol'
    },
    {
      icon: Printer,
      label: 'Printer Model',
      value: printerModel,
      description: 'Connected printer device'
    },
  ];

  return (
    <PageContainer title="Info" showBack onBack={onBack}>
      <div className="space-y-3">
        {infoItems.map((item, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <item.icon className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="font-medium text-foreground">{item.value}</p>
              </div>
            </div>
          </Card>
        ))}

        {showNetworkInfo && (
          <Card className="p-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Network className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Network Information</p>
                <p className="font-medium text-foreground">Device Network Details</p>
              </div>
            </div>
            <div className="ml-16 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IP Address</span>
                <span className="font-mono text-foreground">{networkInfo.ipAddress}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subnet Mask</span>
                <span className="font-mono text-foreground">{networkInfo.subnetMask}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Gateway</span>
                <span className="font-mono text-foreground">{networkInfo.gateway}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">DNS</span>
                <span className="font-mono text-foreground">{networkInfo.dns}</span>
              </div>
            </div>
          </Card>
        )}

        {!showNetworkInfo && (
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                <Network className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Network Information</p>
                <p className="font-medium text-foreground">Not available for RS485 protocol</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </PageContainer>
  );
};

export default InfoSettings;
