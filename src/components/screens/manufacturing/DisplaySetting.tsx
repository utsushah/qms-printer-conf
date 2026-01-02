import React, { useState } from 'react';
import { Monitor, Users } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import SaveButton from '@/components/common/SaveButton';
import SettingRow from '@/components/common/SettingRow';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettings } from '@/contexts/SettingsContext';
import { toast } from '@/hooks/use-toast';
import { DisplaySettings as DisplaySettingsType, DigitSetting } from '@/types/settings';
import { esp32Api } from '@/api/esp32';

interface DisplaySettingProps {
  onBack: () => void;
}

const DIGIT_OPTIONS: { value: DigitSetting; label: string }[] = [
  { value: 3, label: '3 Digit' },
  { value: 4, label: '4 Digit' },
  { value: 5, label: '5 Digit' },
  { value: 6, label: '6 Digit' },
];

const DisplaySetting: React.FC<DisplaySettingProps> = ({ onBack }) => {
  const { settings, updateManufacturingSettings } = useSettings();
  const [display, setDisplay] = useState<DisplaySettingsType>(settings.manufacturing.display);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const result = await esp32Api.saveDisplaySettings(display);
      
      if (result.success) {
        updateManufacturingSettings({ display });
        toast({
          title: "Settings Saved",
          description: "Display settings updated successfully",
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

  return (
    <PageContainer title="Display Setting" showBack onBack={onBack}>
      <div className="space-y-4">
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Monitor className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Counter Display</h3>
              <p className="text-sm text-muted-foreground">Token counter screens</p>
            </div>
          </div>
          
          <SettingRow label="Enable Counter Display">
            <Switch
              checked={display.counterDisplay.enabled}
              onCheckedChange={(checked) => setDisplay(prev => ({
                ...prev,
                counterDisplay: { ...prev.counterDisplay, enabled: checked }
              }))}
            />
          </SettingRow>
          
          {display.counterDisplay.enabled && (
            <div className="mt-3 space-y-3">
              <div>
                <Label className="text-sm text-muted-foreground">Number of Displays</Label>
                <Input
                  type="number"
                  min={1}
                  max={99}
                  value={display.counterDisplay.numberOfDisplays}
                  onChange={(e) => setDisplay(prev => ({
                    ...prev,
                    counterDisplay: { 
                      ...prev.counterDisplay, 
                      numberOfDisplays: Math.max(1, Math.min(99, parseInt(e.target.value) || 1))
                    }
                  }))}
                  className="mt-2 w-24"
                />
              </div>
              
              <div>
                <Label className="text-sm text-muted-foreground">Digit Setting</Label>
                <Select 
                  value={String(display.counterDisplay.digitSetting)} 
                  onValueChange={(v) => setDisplay(prev => ({
                    ...prev,
                    counterDisplay: { ...prev.counterDisplay, digitSetting: parseInt(v) as DigitSetting }
                  }))}
                >
                  <SelectTrigger className="mt-2 w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIGIT_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Waiting Area Display</h3>
              <p className="text-sm text-muted-foreground">Queue status screens</p>
            </div>
          </div>
          
          <SettingRow label="Enable Waiting Area Display">
            <Switch
              checked={display.waitingAreaDisplay.enabled}
              onCheckedChange={(checked) => setDisplay(prev => ({
                ...prev,
                waitingAreaDisplay: { ...prev.waitingAreaDisplay, enabled: checked }
              }))}
            />
          </SettingRow>
          
          {display.waitingAreaDisplay.enabled && (
            <div className="mt-3 space-y-3">
              <div>
                <Label className="text-sm text-muted-foreground">Number of Displays</Label>
                <Input
                  type="number"
                  min={1}
                  max={99}
                  value={display.waitingAreaDisplay.numberOfDisplays}
                  onChange={(e) => setDisplay(prev => ({
                    ...prev,
                    waitingAreaDisplay: { 
                      ...prev.waitingAreaDisplay, 
                      numberOfDisplays: Math.max(1, Math.min(99, parseInt(e.target.value) || 1))
                    }
                  }))}
                  className="mt-2 w-24"
                />
              </div>
              
              <div>
                <Label className="text-sm text-muted-foreground">Digit Setting</Label>
                <Select 
                  value={String(display.waitingAreaDisplay.digitSetting)} 
                  onValueChange={(v) => setDisplay(prev => ({
                    ...prev,
                    waitingAreaDisplay: { ...prev.waitingAreaDisplay, digitSetting: parseInt(v) as DigitSetting }
                  }))}
                >
                  <SelectTrigger className="mt-2 w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIGIT_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </Card>
      </div>

      <div className="mt-4">
        <SaveButton onClick={handleSave} loading={loading} />
      </div>
    </PageContainer>
  );
};

export default DisplaySetting;