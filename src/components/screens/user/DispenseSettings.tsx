import React, { useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import SaveButton from '@/components/common/SaveButton';
import SettingRow from '@/components/common/SettingRow';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useSettings } from '@/contexts/SettingsContext';
import { toast } from '@/hooks/use-toast';
import { DispenseSettings as DispenseSettingsType, ServiceCode } from '@/types/settings';
import { ArrowRight } from 'lucide-react';

interface DispenseSettingsProps {
  onBack: () => void;
}

const DispenseSettings: React.FC<DispenseSettingsProps> = ({ onBack }) => {
  const { settings, updateDispenseSettings, getActiveServices } = useSettings();
  const [dispense, setDispense] = useState<DispenseSettingsType>(settings.user.dispense);
  const [loading, setLoading] = useState(false);

  const activeServices = getActiveServices();

  const toggleTokenStart = (service: ServiceCode, enabled: boolean) => {
    setDispense(prev => ({
      ...prev,
      tokenStart: {
        ...prev.tokenStart,
        [service]: { ...prev.tokenStart[service], enabled }
      }
    }));
  };

  const updateStartNumber = (service: ServiceCode, value: string) => {
    const num = parseInt(value) || 1;
    if (num < 1 || num > 9999) return;
    setDispense(prev => ({
      ...prev,
      tokenStart: {
        ...prev.tokenStart,
        [service]: { ...prev.tokenStart[service], startNumber: num }
      }
    }));
  };

  const handleJump = () => {
    if (!dispense.jumpToService) {
      toast({
        title: "Validation Error",
        description: "Please select a service to jump to",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Token Jumped",
      description: `Jumped to token ${dispense.jumpToNumber} for service ${dispense.jumpToService}`,
    });
  };

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      updateDispenseSettings(dispense);
      setLoading(false);
      toast({
        title: "Settings Saved",
        description: "Dispense settings updated successfully",
      });
    }, 500);
  };

  if (activeServices.length === 0) {
    return (
      <PageContainer title="Dispense Settings" showBack onBack={onBack}>
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">No active services configured.</p>
          <p className="text-sm text-muted-foreground mt-2">Enable services in Manufacturing Settings.</p>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Dispense Settings" showBack onBack={onBack}>
      <div className="space-y-4">
        <Card className="p-4">
          <h3 className="font-medium text-foreground mb-4">Token Start Number</h3>
          <p className="text-sm text-muted-foreground mb-4">Set starting token number for each active service</p>
          
          <div className="space-y-3">
            {activeServices.map(service => (
              <div key={service} className="bg-muted/50 rounded-lg p-3">
                <SettingRow 
                  label={`Service ${service}`}
                  description="Enable custom start number"
                >
                  <Switch
                    checked={dispense.tokenStart[service]?.enabled || false}
                    onCheckedChange={(checked) => toggleTokenStart(service, checked)}
                  />
                </SettingRow>
                {dispense.tokenStart[service]?.enabled && (
                  <div className="mt-3 flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground whitespace-nowrap">Start at:</Label>
                    <Input
                      type="number"
                      min={1}
                      max={9999}
                      value={dispense.tokenStart[service]?.startNumber || 1}
                      onChange={(e) => updateStartNumber(service, e.target.value)}
                      className="w-24"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-medium text-foreground mb-4">Jump to Token</h3>
          <p className="text-sm text-muted-foreground mb-4">Skip to a specific token number</p>
          
          <div className="space-y-3">
            <div>
              <Label className="text-sm text-muted-foreground">Select Service</Label>
              <Select 
                value={dispense.jumpToService || ''} 
                onValueChange={(v) => setDispense(prev => ({ ...prev, jumpToService: v as ServiceCode }))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Choose service" />
                </SelectTrigger>
                <SelectContent>
                  {activeServices.map(service => (
                    <SelectItem key={service} value={service}>Service {service}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm text-muted-foreground">Token Number</Label>
              <Input
                type="number"
                min={1}
                max={9999}
                value={dispense.jumpToNumber}
                onChange={(e) => setDispense(prev => ({ ...prev, jumpToNumber: parseInt(e.target.value) || 1 }))}
                className="mt-2"
              />
            </div>

            <Button onClick={handleJump} variant="outline" className="w-full">
              <ArrowRight className="h-4 w-4 mr-2" />
              Jump to Token
            </Button>
          </div>
        </Card>
      </div>

      <div className="mt-4">
        <SaveButton onClick={handleSave} loading={loading} />
      </div>
    </PageContainer>
  );
};

export default DispenseSettings;
