import React, { useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import SaveButton from '@/components/common/SaveButton';
import SettingRow from '@/components/common/SettingRow';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useSettings } from '@/contexts/SettingsContext';
import { toast } from '@/hooks/use-toast';
import { ReceiptSettings as ReceiptSettingsType } from '@/types/settings';
import { esp32Api } from '@/api/esp32';

interface ReceiptSettingsProps {
  onBack: () => void;
}

const ReceiptSettings: React.FC<ReceiptSettingsProps> = ({ onBack }) => {
  const { settings, updateReceiptSettings } = useSettings();
  const [receipt, setReceipt] = useState<ReceiptSettingsType>(settings.user.receipt);
  const [loading, setLoading] = useState(false);

  const updateDepartment = (enabled: boolean, name?: string) => {
    setReceipt(prev => ({
      ...prev,
      department: { 
        enabled, 
        name: name !== undefined ? name : prev.department.name 
      }
    }));
  };

  const updateFirmLines = (numberOfLines: number, lines?: string[]) => {
    setReceipt(prev => ({
      ...prev,
      firmLines: {
        numberOfLines,
        lines: lines || Array(numberOfLines).fill('').map((_, i) => prev.firmLines.lines[i] || '')
      }
    }));
  };

  const updateFirmLine = (index: number, value: string) => {
    if (value.length > 34) return;
    setReceipt(prev => ({
      ...prev,
      firmLines: {
        ...prev.firmLines,
        lines: prev.firmLines.lines.map((l, i) => i === index ? value : l)
      }
    }));
  };

  const updateMessageLines = (numberOfLines: number, lines?: string[]) => {
    setReceipt(prev => ({
      ...prev,
      messageLines: {
        numberOfLines,
        lines: lines || Array(numberOfLines).fill('').map((_, i) => prev.messageLines.lines[i] || '')
      }
    }));
  };

  const updateMessageLine = (index: number, value: string) => {
    if (value.length > 34) return;
    setReceipt(prev => ({
      ...prev,
      messageLines: {
        ...prev.messageLines,
        lines: prev.messageLines.lines.map((l, i) => i === index ? value : l)
      }
    }));
  };

  const handleSave = async () => {
    if (receipt.department.enabled && receipt.department.name.length > 34) {
      toast({
        title: "Validation Error",
        description: "Department name must be 34 characters or less",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await esp32Api.saveReceiptSettings(receipt);
      
      if (result.success) {
        updateReceiptSettings(receipt);
        toast({
          title: "Settings Saved",
          description: "Receipt settings updated successfully",
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
    <PageContainer title="Receipt Settings" showBack onBack={onBack}>
      <div className="space-y-4">
        {/* Department Setting */}
        <Card className="p-4">
          <h3 className="font-medium text-foreground mb-4">Department Setting</h3>
          <SettingRow label="Enable Department" description="Show department on receipt">
            <Switch 
              checked={receipt.department.enabled}
              onCheckedChange={(checked) => updateDepartment(checked)}
            />
          </SettingRow>
          {receipt.department.enabled && (
            <div className="mt-3">
              <Label className="text-sm text-muted-foreground">Department Name (max 34 chars)</Label>
              <Input
                value={receipt.department.name}
                onChange={(e) => updateDepartment(true, e.target.value.slice(0, 34))}
                placeholder="Enter department name"
                maxLength={34}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">{receipt.department.name.length}/34</p>
            </div>
          )}
        </Card>

        {/* Firm Lines Setting */}
        <Card className="p-4">
          <h3 className="font-medium text-foreground mb-4">Firm Line Setting</h3>
          <div className="mb-4">
            <Label className="text-sm text-muted-foreground">Number of Lines</Label>
            <Select 
              value={String(receipt.firmLines.numberOfLines)} 
              onValueChange={(v) => updateFirmLines(Number(v))}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4].map(n => (
                  <SelectItem key={n} value={String(n)}>{n} Line{n > 1 ? 's' : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            {Array(receipt.firmLines.numberOfLines).fill(0).map((_, i) => (
              <div key={i}>
                <Label className="text-sm text-muted-foreground">Line {i + 1}</Label>
                <Input
                  value={receipt.firmLines.lines[i] || ''}
                  onChange={(e) => updateFirmLine(i, e.target.value)}
                  placeholder={`Enter firm name line ${i + 1}`}
                  maxLength={34}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">{(receipt.firmLines.lines[i] || '').length}/34</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Message Lines Setting */}
        <Card className="p-4">
          <h3 className="font-medium text-foreground mb-4">Message Line Setting</h3>
          <div className="mb-4">
            <Label className="text-sm text-muted-foreground">Number of Lines</Label>
            <Select 
              value={String(receipt.messageLines.numberOfLines)} 
              onValueChange={(v) => updateMessageLines(Number(v))}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4].map(n => (
                  <SelectItem key={n} value={String(n)}>{n} Line{n > 1 ? 's' : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            {Array(receipt.messageLines.numberOfLines).fill(0).map((_, i) => (
              <div key={i}>
                <Label className="text-sm text-muted-foreground">Message {i + 1}</Label>
                <Input
                  value={receipt.messageLines.lines[i] || ''}
                  onChange={(e) => updateMessageLine(i, e.target.value)}
                  placeholder={`Enter message line ${i + 1}`}
                  maxLength={34}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">{(receipt.messageLines.lines[i] || '').length}/34</p>
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

export default ReceiptSettings;
