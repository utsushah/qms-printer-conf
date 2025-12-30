import React, { useState, useCallback } from 'react';
import SplashScreen from './screens/SplashScreen';
import MainMenu from './screens/MainMenu';
import UserSettingsMenu from './screens/UserSettingsMenu';
import ManufacturingMenu from './screens/ManufacturingMenu';
import LanguageSettings from './screens/user/LanguageSettings';
import CallingMethodSettings from './screens/user/CallingMethodSettings';
import ReceiptSettings from './screens/user/ReceiptSettings';
import DateTimeSettings from './screens/user/DateTimeSettings';
import DispenseSettings from './screens/user/DispenseSettings';
import WiFiSettings from './screens/user/WiFiSettings';
import InfoSettings from './screens/user/InfoSettings';
import ServiceSetting from './screens/manufacturing/ServiceSetting';
import RemoteSetting from './screens/manufacturing/RemoteSetting';
import DisplaySetting from './screens/manufacturing/DisplaySetting';
import PrinterSetting from './screens/manufacturing/PrinterSetting';
import ProtocolSetting from './screens/manufacturing/ProtocolSetting';
import SoftwareUpdate from './screens/manufacturing/SoftwareUpdate';

type Screen = 
  | 'splash'
  | 'main'
  | 'user'
  | 'manufacturing'
  | 'language'
  | 'calling'
  | 'receipt'
  | 'datetime'
  | 'dispense'
  | 'wifi'
  | 'info'
  | 'mfg-service'
  | 'mfg-remote'
  | 'mfg-display'
  | 'mfg-printer'
  | 'mfg-protocol'
  | 'mfg-update';

const AppNavigator: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [screenHistory, setScreenHistory] = useState<Screen[]>([]);

  const navigateTo = useCallback((screen: Screen) => {
    setScreenHistory(prev => [...prev, currentScreen]);
    setCurrentScreen(screen);
  }, [currentScreen]);

  const goBack = useCallback(() => {
    const newHistory = [...screenHistory];
    const previousScreen = newHistory.pop() || 'main';
    setScreenHistory(newHistory);
    setCurrentScreen(previousScreen);
  }, [screenHistory]);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SplashScreen onComplete={() => setCurrentScreen('main')} />;
      
      case 'main':
        return <MainMenu onNavigate={(s) => navigateTo(s as Screen)} />;
      
      case 'user':
        return <UserSettingsMenu onNavigate={(s) => navigateTo(s as Screen)} onBack={goBack} />;
      
      case 'manufacturing':
        return <ManufacturingMenu onNavigate={(s) => navigateTo(s as Screen)} onBack={goBack} />;
      
      // User Settings Screens
      case 'language':
        return <LanguageSettings onBack={goBack} />;
      case 'calling':
        return <CallingMethodSettings onBack={goBack} />;
      case 'receipt':
        return <ReceiptSettings onBack={goBack} />;
      case 'datetime':
        return <DateTimeSettings onBack={goBack} />;
      case 'dispense':
        return <DispenseSettings onBack={goBack} />;
      case 'wifi':
        return <WiFiSettings onBack={goBack} />;
      case 'info':
        return <InfoSettings onBack={goBack} />;
      
      // Manufacturing Settings Screens
      case 'mfg-service':
        return <ServiceSetting onBack={goBack} />;
      case 'mfg-remote':
        return <RemoteSetting onBack={goBack} />;
      case 'mfg-display':
        return <DisplaySetting onBack={goBack} />;
      case 'mfg-printer':
        return <PrinterSetting onBack={goBack} />;
      case 'mfg-protocol':
        return <ProtocolSetting onBack={goBack} />;
      case 'mfg-update':
        return <SoftwareUpdate onBack={goBack} />;
      
      default:
        return <MainMenu onNavigate={(s) => navigateTo(s as Screen)} />;
    }
  };

  return <>{renderScreen()}</>;
};

export default AppNavigator;
