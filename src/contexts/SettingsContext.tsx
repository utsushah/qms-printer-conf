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
  updateLanguageSettings: (lang: LanguageSettings) => void;
  updateCallingMethod: (method: CallingMethod) => void;
  updateReceiptSettings: (receipt: ReceiptSettings) => void;
  syncDateTime: () => void;
  updateDispenseSettings: (dispense: DispenseSettings) => void;
  updateManufacturingSettings: (mfg: Partial<ManufacturingSettings>) => void;
  updateProtocol: (protocol: ProtocolType) => void;
  getActiveServices: () => ServiceCode[];
  validateServiceCount: (services: ServiceCode[]) => boolean;
  getModelLimit: (model: ModelType) => number;
  SERVICE_CODES: ServiceCode[];
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AllSettings>(defaultSettings);

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

  const syncDateTime = useCallback(() => {
    const now = new Date().toISOString();
    setSettings(prev => ({
      ...prev,
      user: {
        ...prev.user,
        dateTime: { deviceDateTime: now, systemDateTime: now },
      },
    }));
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
