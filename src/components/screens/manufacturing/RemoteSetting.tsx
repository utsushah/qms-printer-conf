import React, { useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import SaveButton from '@/components/common/SaveButton';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettings } from '@/contexts/SettingsContext';
import { toast } from '@/hooks/use-toast';
import { RemoteSettings as RemoteSettingsType, RemoteDevice, ServiceCode } from '@/types/settings';
import { esp32Api } from '@/api/esp32';

interface RemoteSettingProps {
  onBack: () => void;
}

const RemoteSetting: React.FC<RemoteSettingProps> = ({ onBack }) => {
  const { settings, updateManufacturingSettings } = useSettings();
  const [remote, setRemote] = useState<RemoteSettingsType>(settings.manufacturing.remote);
  const [loading, setLoading] = useState(false);

  const activeServices = settings.manufacturing.service.activeServices;

  const handleDeviceCountChange = (count: number) => {
    const newCount = Math.max(1, Math.min(10, count));
    const currentDevices = remote.devices;
    
    let newDevices: RemoteDevice[];
    if (newCount > currentDevices.length) {
      // Add new devices
      newDevices = [
        ...currentDevices,
        ...Array(newCount - currentDevices.length).fill(null).map(() => ({
          remoteId: '',
          serviceCode: activeServices[0] || 'A' as ServiceCode
        }))
      ];
    } else {
      // Remove devices
      newDevices = currentDevices.slice(0, newCount);
    }
    
    setRemote({ numberOfDevices: newCount, devices: newDevices });
  };

  const updateDevice = (index: number, field: keyof RemoteDevice, value: string) => {
    setRemote(prev => ({
      ...prev,
      devices: prev.devices.map((device, i) => 
        i === index ? { ...device, [field]: value } : device
      )
    }));
  };

  const handleSave = async () => {
    // Validate all devices have Remote IDs
    const emptyRemoteIds = remote.devices.some(d => !d.remoteId.trim());
    if (emptyRemoteIds) {
      toast({
        title: "Validation Error",
        description: "All devices must have a Remote ID",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await esp32Api.saveRemoteSettings(remote);
      
      if (result.success) {
        updateManufacturingSettings({ remote });
        toast({
          title: "Settings Saved",
          description: "Remote settings updated successfully",
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
    <PageContainer title="Remote Setting" showBack onBack={onBack}>
      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Number of Devices</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={remote.numberOfDevices}
              onChange={(e) => handleDeviceCountChange(parseInt(e.target.value) || 1)}
              className="mt-2"
            />
          </div>
        </div>
      </Card>

      <div className="space-y-3 mt-4">
        {remote.devices.map((device, index) => (
          <Card key={index} className="p-4">
            <h3 className="font-medium text-foreground mb-4">Device {index + 1}</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Remote ID</Label>
                <Input
                  value={device.remoteId}
                  onChange={(e) => updateDevice(index, 'remoteId', e.target.value)}
                  placeholder="Enter Remote ID"
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Service Code</Label>
                <Select 
                  value={device.serviceCode} 
                  onValueChange={(v) => updateDevice(index, 'serviceCode', v)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {activeServices.map(code => (
                      <SelectItem key={code} value={code}>Service {code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {activeServices.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-2">No active services. Configure in Service Setting first.</p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-4">
        <SaveButton onClick={handleSave} loading={loading} />
      </div>
    </PageContainer>
  );
};

export default RemoteSetting;
