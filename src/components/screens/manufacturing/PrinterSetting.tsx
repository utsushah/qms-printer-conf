import React, { useState } from 'react';
import { Printer, Copy, Check, Hash } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import SaveButton from '@/components/common/SaveButton';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSettings } from '@/contexts/SettingsContext';
import { toast } from '@/hooks/use-toast';
import { PrinterSettings as PrinterSettingsType, PrinterModel } from '@/types/settings';
import { esp32Api } from '@/api/esp32';

interface PrinterSettingProps {
  onBack: () => void;
}

const PRINTER_MODELS: { model: PrinterModel; name: string; description: string }[] = [
  { model: 'KP-628E', name: 'KP - 628E', description: 'High-speed thermal printer' },
  { model: 'EP-260C', name: 'EP - 260C', description: 'Compact receipt printer' },
];

const PrinterSetting: React.FC<PrinterSettingProps> = ({ onBack }) => {
  const { settings, updateManufacturingSettings } = useSettings();
  const [printer, setPrinter] = useState<PrinterSettingsType>(settings.manufacturing.printer);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (printer.tokenCopies < 1 || printer.tokenCopies > 10) {
      toast({
        title: "Validation Error",
        description: "Token copies must be between 1 and 10",
        variant: "destructive",
      });
      return;
    }

    if (!printer.printerId.trim()) {
      toast({
        title: "Validation Error",
        description: "Printer ID is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await esp32Api.savePrinterSettings(printer);
      
      if (result.success) {
        updateManufacturingSettings({ printer });
        toast({
          title: "Settings Saved",
          description: "Printer settings updated successfully",
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
    <PageContainer title="Printer Setting" showBack onBack={onBack}>
      <div className="space-y-4">
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Hash className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Printer ID</h3>
              <p className="text-sm text-muted-foreground">Unique identifier for this printer</p>
            </div>
          </div>
          
          <div>
            <Label className="text-sm text-muted-foreground">Printer ID</Label>
            <Input
              type="text"
              value={printer.printerId}
              onChange={(e) => setPrinter(prev => ({ ...prev, printerId: e.target.value }))}
              placeholder="Enter Printer ID"
              className="mt-2"
            />
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-medium text-foreground mb-4">Device Model</h3>
          <div className="space-y-2">
            {PRINTER_MODELS.map(model => (
              <div
                key={model.model}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  printer.deviceModel === model.model 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/30'
                }`}
                onClick={() => setPrinter(prev => ({ ...prev, deviceModel: model.model }))}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Printer className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">{model.name}</p>
                      <p className="text-sm text-muted-foreground">{model.description}</p>
                    </div>
                  </div>
                  {printer.deviceModel === model.model && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Copy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Token Copy Setting</h3>
              <p className="text-sm text-muted-foreground">Receipts per token issued</p>
            </div>
          </div>
          
          <div>
            <Label className="text-sm text-muted-foreground">Number of Copies (1-10)</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={printer.tokenCopies}
              onChange={(e) => setPrinter(prev => ({ 
                ...prev, 
                tokenCopies: Math.max(1, Math.min(10, parseInt(e.target.value) || 1))
              }))}
              className="mt-2 w-24"
            />
          </div>
        </Card>
      </div>

      <div className="mt-4">
        <SaveButton onClick={handleSave} loading={loading} />
      </div>
    </PageContainer>
  );
};

export default PrinterSetting;