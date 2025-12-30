import React, { useState } from 'react';
import { Phone, MousePointer2 } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import SaveButton from '@/components/common/SaveButton';
import { Card } from '@/components/ui/card';
import { useSettings } from '@/contexts/SettingsContext';
import { toast } from '@/hooks/use-toast';
import { CallingMethod } from '@/types/settings';

interface CallingMethodSettingsProps {
  onBack: () => void;
}

const CallingMethodSettings: React.FC<CallingMethodSettingsProps> = ({ onBack }) => {
  const { settings, updateCallingMethod } = useSettings();
  const [method, setMethod] = useState<CallingMethod>(settings.user.callingMethod);
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      updateCallingMethod(method);
      setLoading(false);
      toast({
        title: "Settings Saved",
        description: "Calling method updated successfully",
      });
    }, 500);
  };

  return (
    <PageContainer title="Calling Method" showBack onBack={onBack}>
      <div className="space-y-3">
        <Card 
          className={`p-4 cursor-pointer transition-all border-2 ${method === 'Next Button' ? 'border-primary bg-primary/5' : 'border-transparent hover:border-primary/30'}`}
          onClick={() => setMethod('Next Button')}
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${method === 'Next Button' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              <MousePointer2 className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-foreground">Next Button</h3>
              <p className="text-sm text-muted-foreground">Call next token automatically</p>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 ${method === 'Next Button' ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
              {method === 'Next Button' && (
                <div className="w-full h-full rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card 
          className={`p-4 cursor-pointer transition-all border-2 ${method === 'Call Button' ? 'border-primary bg-primary/5' : 'border-transparent hover:border-primary/30'}`}
          onClick={() => setMethod('Call Button')}
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${method === 'Call Button' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              <Phone className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-foreground">Call Button</h3>
              <p className="text-sm text-muted-foreground">Manual call for specific token</p>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 ${method === 'Call Button' ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
              {method === 'Call Button' && (
                <div className="w-full h-full rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      <SaveButton onClick={handleSave} loading={loading} />
    </PageContainer>
  );
};

export default CallingMethodSettings;
