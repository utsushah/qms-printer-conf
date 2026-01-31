import React, { useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import SaveButton from '@/components/common/SaveButton';
import SettingRow from '@/components/common/SettingRow';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useSettings } from '@/contexts/SettingsContext';
import { toast } from '@/hooks/use-toast';
import { DispenseSettings as DispenseSettingsType, ServiceCode } from '@/types/settings';
import { esp32Api } from '@/api/esp32';

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

  const handleSave = async () => {
    setLoading(true);
    try {
      const result = await esp32Api.saveDispenseSettings(dispense);
      
      if (result.success) {
        updateDispenseSettings(dispense);
        toast({
          title: "Settings Saved",
          description: "Dispense settings updated successfully",
        });
      } else {
        toast({
          title: "Save Failed",
          description: result.error || "Failed to save settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
      </div>

      <div className="mt-4">
        <SaveButton onClick={handleSave} loading={loading} />
      </div>
    </PageContainer>
  );
};

export default DispenseSettings;
