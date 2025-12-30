import React from 'react';
import { Clock, RefreshCw, Smartphone, Cpu } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/contexts/SettingsContext';
import { toast } from '@/hooks/use-toast';

interface DateTimeSettingsProps {
  onBack: () => void;
}

const DateTimeSettings: React.FC<DateTimeSettingsProps> = ({ onBack }) => {
  const { settings, syncDateTime } = useSettings();

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return {
      date: date.toLocaleDateString('en-GB', { 
        weekday: 'short', 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      })
    };
  };

  const handleSync = () => {
    syncDateTime();
    toast({
      title: "Time Synced",
      description: "Device time synchronized with system time",
    });
  };

  const deviceDT = formatDateTime(settings.user.dateTime.deviceDateTime);
  const systemDT = formatDateTime(settings.user.dateTime.systemDateTime);

  return (
    <PageContainer title="Date & Time" showBack onBack={onBack}>
      <div className="space-y-4">
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Cpu className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Device Time (ESP32)</h3>
              <p className="text-sm text-muted-foreground">Current device clock</p>
            </div>
          </div>
          <div className="bg-muted rounded-lg p-4 text-center">
            <p className="text-2xl font-mono font-semibold text-foreground">{deviceDT.time}</p>
            <p className="text-sm text-muted-foreground mt-1">{deviceDT.date}</p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Smartphone className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">System Time</h3>
              <p className="text-sm text-muted-foreground">Mobile/PC clock</p>
            </div>
          </div>
          <div className="bg-muted rounded-lg p-4 text-center">
            <p className="text-2xl font-mono font-semibold text-foreground">{systemDT.time}</p>
            <p className="text-sm text-muted-foreground mt-1">{systemDT.date}</p>
          </div>
        </Card>

        <Button 
          onClick={handleSync}
          className="w-full py-6 bg-primary hover:bg-primary/90"
        >
          <RefreshCw className="h-5 w-5 mr-2" />
          Sync Device with System Time
        </Button>
      </div>
    </PageContainer>
  );
};

export default DateTimeSettings;
