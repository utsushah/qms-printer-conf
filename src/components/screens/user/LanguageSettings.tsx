import React, { useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import SaveButton from '@/components/common/SaveButton';
import SettingRow from '@/components/common/SettingRow';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettings } from '@/contexts/SettingsContext';
import { toast } from '@/hooks/use-toast';
import { Language } from '@/types/settings';

interface LanguageSettingsProps {
  onBack: () => void;
}

const LANGUAGES: Language[] = ['English', 'Hindi', 'Gujarati'];

const DisplayAudioLanguageSettings: React.FC<LanguageSettingsProps> = ({ onBack }) => {
  const { settings, updateLanguageSettings, saveSettings } = useSettings();
  const [firstLang, setFirstLang] = useState<Language>(settings.user.language.firstLanguage);
  const [secondLang, setSecondLang] = useState<Language>(settings.user.language.secondLanguage);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (firstLang === secondLang) {
      toast({
        title: "Validation Error",
        description: "First and second language cannot be the same",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    updateLanguageSettings({ firstLanguage: firstLang, secondLanguage: secondLang });
    const result = await saveSettings();
    setLoading(false);
    
    if (result.success) {
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
  };

  const isValid = firstLang !== secondLang;

  return (
    <PageContainer title="Display Audio Language" showBack onBack={onBack}>
      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">1st Language</Label>
            <Select value={firstLang} onValueChange={(v) => setFirstLang(v as Language)}>
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
            <Select value={secondLang} onValueChange={(v) => setSecondLang(v as Language)}>
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

      <SaveButton onClick={handleSave} loading={loading} disabled={!isValid} />
    </PageContainer>
  );
};

export default DisplayAudioLanguageSettings;
