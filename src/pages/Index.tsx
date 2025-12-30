import React from 'react';
import { SettingsProvider } from '@/contexts/SettingsContext';
import AppNavigator from '@/components/AppNavigator';

const Index = () => {
  return (
    <SettingsProvider>
      <AppNavigator />
    </SettingsProvider>
  );
};

export default Index;
