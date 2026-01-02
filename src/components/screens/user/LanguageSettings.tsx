import React, { useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import SaveButton from '@/components/common/SaveButton';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettings } from '@/contexts/SettingsContext';
import { toast } from '@/hooks/use-toast';
import { Language, TokenLabel, CounterLabel, LanguageSettings as LanguageSettingsType } from '@/types/settings';
import { esp32Api } from '@/api/esp32';

interface LanguageSettingsProps {
  onBack: () => void;
}

const LANGUAGES: Language[] = ['English', 'Hindi', 'Gujarati'];
const TOKEN_LABELS: TokenLabel[] = ['Token No.', 'Order No.', 'File No.'];
const COUNTER_LABELS: CounterLabel[] = ['Counter No.', 'Room No.', 'Desk No.'];

const DisplayAudioLanguageSettings: React.FC<LanguageSettingsProps> = ({ onBack }) => {
  const { settings, updateLanguageSettings } = useSettings();
  const [langSettings, setLangSettings] = useState<LanguageSettingsType>(settings.user.language);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (langSettings.firstLanguage === langSettings.secondLanguage) {
      toast({
        title: "Validation Error",
        description: "First and second language cannot be the same",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await esp32Api.saveLanguageSettings(langSettings);
      
      if (result.success) {
        updateLanguageSettings(langSettings);
        toast({
          title: "Settings Saved",
          description: "Language settings updated successfully",
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

  const isValid = langSettings.firstLanguage !== langSettings.secondLanguage;

  return (
    <PageContainer title="Display Audio Language" showBack onBack={onBack}>
      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">1st Language</Label>
            <Select 
              value={langSettings.firstLanguage} 
              onValueChange={(v) => setLangSettings(prev => ({ ...prev, firstLanguage: v as Language }))}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(lang => (
                  <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">2nd Language</Label>
            <Select 
              value={langSettings.secondLanguage} 
              onValueChange={(v) => setLangSettings(prev => ({ ...prev, secondLanguage: v as Language }))}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(lang => (
                  <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!isValid && (
            <p className="text-sm text-destructive">
              Languages must be different
            </p>
          )}
        </div>
      </Card>

      <Card className="p-4 mt-4">
        <h3 className="font-medium text-foreground mb-4">Display Labels</h3>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Token Label</Label>
            <Select 
              value={langSettings.tokenLabel} 
              onValueChange={(v) => setLangSettings(prev => ({ ...prev, tokenLabel: v as TokenLabel }))}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TOKEN_LABELS.map(label => (
                  <SelectItem key={label} value={label}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">Counter Label</Label>
            <Select 
              value={langSettings.counterLabel} 
              onValueChange={(v) => setLangSettings(prev => ({ ...prev, counterLabel: v as CounterLabel }))}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTER_LABELS.map(label => (
                  <SelectItem key={label} value={label}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <SaveButton onClick={handleSave} loading={loading} disabled={!isValid} />
    </PageContainer>
  );
};

export default DisplayAudioLanguageSettings;