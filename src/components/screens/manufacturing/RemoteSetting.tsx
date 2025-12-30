import React, { useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import SaveButton from '@/components/common/SaveButton';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettings } from '@/contexts/SettingsContext';
import { toast } from '@/hooks/use-toast';
import { RemoteSettings as RemoteSettingsType, ServiceCode } from '@/types/settings';

interface RemoteSettingProps {
  onBack: () => void;
}

const RemoteSetting: React.FC<RemoteSettingProps> = ({ onBack }) => {
  const { settings, updateManufacturingSettings, SERVICE_CODES } = useSettings();
  const [remote, setRemote] = useState<RemoteSettingsType>(settings.manufacturing.remote);
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    if (!remote.remoteId.trim()) {
      toast({
        title: "Validation Error",
        description: "Remote ID is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      updateManufacturingSettings({ remote });
      setLoading(false);
      toast({
        title: "Settings Saved",
        description: "Remote settings updated successfully",
      });
    }, 500);
  };

  return (
    <PageContainer title="Remote Setting" showBack onBack={onBack}>
      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Remote ID</Label>
            <Input
              value={remote.remoteId}
              onChange={(e) => setRemote(prev => ({ ...prev, remoteId: e.target.value }))}
              placeholder="Enter Remote ID"
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">Service Code</Label>
            <Select 
              value={remote.serviceCode} 
              onValueChange={(v) => setRemote(prev => ({ ...prev, serviceCode: v as ServiceCode }))}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_CODES.map(code => (
                  <SelectItem key={code} value={code}>Service {code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <div className="mt-4">
        <SaveButton onClick={handleSave} loading={loading} />
      </div>
    </PageContainer>
  );
};

export default RemoteSetting;
