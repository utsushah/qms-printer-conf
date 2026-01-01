import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { 
  AllSettings, 
  Language, 
  CallingMethod, 
  ServiceCode, 
  ModelType, 
  PrinterModel, 
  ProtocolType,
  LanguageSettings,
  ReceiptSettings,
  DispenseSettings,
  ManufacturingSettings,
  UserSettings
} from '@/types/settings';
import { esp32Api } from '@/api/esp32';

const SERVICE_CODES: ServiceCode[] = ['A', 'C', 'E', 'F', 'H', 'J', 'L', 'P', 'U', 'Y'];

const getModelLimit = (model: ModelType): number => {
  switch (model) {
    case 'Easy': return 1;
    case 'Lite': return 4;
    case 'Classic': return 8;
  }
};

const defaultSettings: AllSettings = {
  user: {
    language: {
      firstLanguage: 'English',
      secondLanguage: 'Hindi',
    },
    callingMethod: 'Next Button',
    receipt: {
      department: { enabled: false, name: '' },
      firmLines: { numberOfLines: 1, lines: [''] },
      messageLines: { numberOfLines: 1, lines: [''] },
    },
    dateTime: {
      deviceDateTime: new Date().toISOString(),
      systemDateTime: new Date().toISOString(),
    },
    dispense: {
      tokenStart: SERVICE_CODES.reduce((acc, code) => ({
        ...acc,
        [code]: { enabled: false, startNumber: 1 }
      }), {} as Record<ServiceCode, { enabled: boolean; startNumber: number }>),
      jumpToService: null,
      jumpToNumber: 1,
    },
    wifi: {
      connected: false,
      currentSSID: '',
      networks: [],
    },
    info: {
      systemInfo: 'ESP32-S3 QMS Printer',
      softwareVersion: 'v1.0.0',
      protocolType: 'Wi-Fi',
      networkInfo: {
        ipAddress: '192.168.1.100',
        subnetMask: '255.255.255.0',
        gateway: '192.168.1.1',
        dns: '8.8.8.8',
      },
      printerModel: 'KP-628E',
    },
  },
  manufacturing: {
    service: {
      model: 'Lite',
      activeServices: ['A', 'C', 'E', 'F'],
    },
    remote: {
      remoteId: '',
      serviceCode: 'A',
    },
    display: {
      counterDisplay: { enabled: false, numberOfDisplays: 1 },
      waitingAreaDisplay: { enabled: false, numberOfDisplays: 1 },
    },
    printer: {
      deviceModel: 'KP-628E',
      tokenCopies: 1,
    },
    protocol: 'Wi-Fi',
  },
};

interface SettingsContextType {
  settings: AllSettings;
  loading: boolean;
  updateLanguageSettings: (lang: LanguageSettings) => void;
  updateCallingMethod: (method: CallingMethod) => void;
  updateReceiptSettings: (receipt: ReceiptSettings) => void;
  syncDateTime: () => Promise<void>;
  updateDispenseSettings: (dispense: DispenseSettings) => void;
  updateManufacturingSettings: (mfg: Partial<ManufacturingSettings>) => void;
  updateProtocol: (protocol: ProtocolType) => void;
  getActiveServices: () => ServiceCode[];
  validateServiceCount: (services: ServiceCode[]) => boolean;
  getModelLimit: (model: ModelType) => number;
  SERVICE_CODES: ServiceCode[];
  saveSettings: (settingsToSave?: Partial<AllSettings>) => Promise<{ success: boolean; error?: string }>;
  loadSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AllSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  // Load settings from ESP32 on mount
  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await esp32Api.getSettings();
      if (data) {
        setSettings(prev => ({
          ...prev,
          ...data,
          user: { ...prev.user, ...data.user },
          manufacturing: { ...prev.manufacturing, ...data.manufacturing },
        }));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Use default settings on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSettings(prev => ({
        ...prev,
        user: {
          ...prev.user,
          dateTime: {
            ...prev.user.dateTime,
            systemDateTime: new Date().toISOString(),
          },
        },
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Save settings to ESP32
  const saveSettings = useCallback(async (settingsToSave?: Partial<AllSettings>): Promise<{ success: boolean; error?: string }> => {
    try {
      const dataToSave = settingsToSave || settings;
      const response = await esp32Api.saveSettings(dataToSave);
      return { success: response.success, error: response.error };
    } catch (error) {
      console.error('Failed to save settings:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to save settings' };
    }
  }, [settings]);

  const updateLanguageSettings = useCallback((lang: LanguageSettings) => {
    setSettings(prev => ({
      ...prev,
      user: { ...prev.user, language: lang },
    }));
  }, []);

  const updateCallingMethod = useCallback((method: CallingMethod) => {
    setSettings(prev => ({
      ...prev,
      user: { ...prev.user, callingMethod: method },
    }));
  }, []);

  const updateReceiptSettings = useCallback((receipt: ReceiptSettings) => {
    setSettings(prev => ({
      ...prev,
      user: { ...prev.user, receipt },
    }));
  }, []);

  const syncDateTime = useCallback(async () => {
    try {
      await esp32Api.syncDateTime();
      const now = new Date().toISOString();
      setSettings(prev => ({
        ...prev,
        user: {
          ...prev.user,
          dateTime: { deviceDateTime: now, systemDateTime: now },
        },
      }));
    } catch (error) {
      console.error('Failed to sync datetime:', error);
      throw error;
    }
  }, []);

  const updateDispenseSettings = useCallback((dispense: DispenseSettings) => {
    setSettings(prev => ({
      ...prev,
      user: { ...prev.user, dispense },
    }));
  }, []);

  const updateManufacturingSettings = useCallback((mfg: Partial<ManufacturingSettings>) => {
    setSettings(prev => ({
      ...prev,
      manufacturing: { ...prev.manufacturing, ...mfg },
      user: {
        ...prev.user,
        info: {
          ...prev.user.info,
          protocolType: mfg.protocol || prev.manufacturing.protocol,
          printerModel: mfg.printer?.deviceModel || prev.user.info.printerModel,
        },
      },
    }));
  }, []);

  const updateProtocol = useCallback((protocol: ProtocolType) => {
    setSettings(prev => ({
      ...prev,
      manufacturing: { ...prev.manufacturing, protocol },
      user: {
        ...prev.user,
        info: { ...prev.user.info, protocolType: protocol },
      },
    }));
  }, []);

  const getActiveServices = useCallback((): ServiceCode[] => {
    return settings.manufacturing.service.activeServices;
  }, [settings.manufacturing.service.activeServices]);

  const validateServiceCount = useCallback((services: ServiceCode[]): boolean => {
    const limit = getModelLimit(settings.manufacturing.service.model);
    return services.length <= limit;
  }, [settings.manufacturing.service.model]);

  return (
    <SettingsContext.Provider value={{
      settings,
      loading,
      updateLanguageSettings,
      updateCallingMethod,
      updateReceiptSettings,
      syncDateTime,
      updateDispenseSettings,
      updateManufacturingSettings,
      updateProtocol,
      getActiveServices,
      validateServiceCount,
      getModelLimit,
      SERVICE_CODES,
      saveSettings,
      loadSettings,
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};
