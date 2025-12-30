import React from 'react';
import { Info, Cpu, Code, Radio } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/card';
import { useSettings } from '@/contexts/SettingsContext';

interface InfoSettingsProps {
  onBack: () => void;
}

const InfoSettings: React.FC<InfoSettingsProps> = ({ onBack }) => {
  const { settings } = useSettings();
  const { systemInfo, softwareVersion, protocolType } = settings.user.info;

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
    }
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
      </div>
    </PageContainer>
  );
};

export default InfoSettings;
