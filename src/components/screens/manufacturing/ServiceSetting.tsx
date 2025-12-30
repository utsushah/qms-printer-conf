import React, { useState } from 'react';
import { Check } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import SaveButton from '@/components/common/SaveButton';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useSettings } from '@/contexts/SettingsContext';
import { toast } from '@/hooks/use-toast';
import { ModelType, ServiceCode, ServiceSettings } from '@/types/settings';

interface ServiceSettingProps {
  onBack: () => void;
}

const MODELS: { type: ModelType; label: string; limit: number; description: string }[] = [
  { type: 'Easy', label: 'Easy', limit: 1, description: '1 Service' },
  { type: 'Lite', label: 'Lite', limit: 4, description: '4 Services' },
  { type: 'Classic', label: 'Classic', limit: 8, description: '8 Services' },
];

const ServiceSetting: React.FC<ServiceSettingProps> = ({ onBack }) => {
  const { settings, updateManufacturingSettings, SERVICE_CODES, getModelLimit } = useSettings();
  const [service, setService] = useState<ServiceSettings>(settings.manufacturing.service);
  const [loading, setLoading] = useState(false);

  const currentLimit = getModelLimit(service.model);

  const handleModelChange = (model: ModelType) => {
    const limit = getModelLimit(model);
    const newActiveServices = service.activeServices.slice(0, limit);
    setService({ model, activeServices: newActiveServices });
  };

  const toggleService = (code: ServiceCode) => {
    const isActive = service.activeServices.includes(code);
    let newServices: ServiceCode[];
    
    if (isActive) {
      newServices = service.activeServices.filter(s => s !== code);
    } else {
      if (service.activeServices.length >= currentLimit) {
        toast({
          title: "Limit Reached",
          description: `${service.model} model supports maximum ${currentLimit} service(s)`,
          variant: "destructive",
        });
        return;
      }
      newServices = [...service.activeServices, code];
    }
    
    setService(prev => ({ ...prev, activeServices: newServices }));
  };

  const handleSave = () => {
    if (service.activeServices.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one service must be active",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      updateManufacturingSettings({ service });
      setLoading(false);
      toast({
        title: "Settings Saved",
        description: "Service settings updated successfully",
      });
    }, 500);
  };

  return (
    <PageContainer title="Service Setting" showBack onBack={onBack}>
      <div className="space-y-4">
        <Card className="p-4">
          <h3 className="font-medium text-foreground mb-4">Select Model</h3>
          <div className="space-y-2">
            {MODELS.map(model => (
              <div
                key={model.type}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  service.model === model.type 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/30'
                }`}
                onClick={() => handleModelChange(model.type)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{model.label}</p>
                    <p className="text-sm text-muted-foreground">{model.description}</p>
                  </div>
                  {service.model === model.type && (
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
          <h3 className="font-medium text-foreground mb-2">Active Services</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Select up to {currentLimit} service(s) • {service.activeServices.length}/{currentLimit} selected
          </p>
          
          <div className="grid grid-cols-5 gap-3">
            {SERVICE_CODES.map(code => {
              const isActive = service.activeServices.includes(code);
              return (
                <div
                  key={code}
                  className={`aspect-square rounded-xl border-2 flex items-center justify-center cursor-pointer transition-all font-bold text-lg ${
                    isActive 
                      ? 'border-primary bg-primary text-primary-foreground' 
                      : 'border-border bg-muted/50 text-muted-foreground hover:border-primary/30'
                  }`}
                  onClick={() => toggleService(code)}
                >
                  {code}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="mt-4">
        <SaveButton onClick={handleSave} loading={loading} />
      </div>
    </PageContainer>
  );
};

export default ServiceSetting;
