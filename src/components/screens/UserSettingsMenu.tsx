import React from 'react';
import { 
  Languages, 
  Phone, 
  Receipt, 
  Clock, 
  Ticket, 
  Wifi, 
  Info 
} from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import MenuCard from '@/components/layout/MenuCard';
import { useSettings } from '@/contexts/SettingsContext';

interface UserSettingsMenuProps {
  onNavigate: (screen: string) => void;
  onBack: () => void;
}

const UserSettingsMenu: React.FC<UserSettingsMenuProps> = ({ onNavigate, onBack }) => {
  const { settings } = useSettings();
  const isWiFiProtocol = settings.manufacturing.protocol === 'Wi-Fi';

  return (
    <PageContainer title="User Settings" showBack onBack={onBack}>
      <div className="space-y-3">
        <MenuCard
          icon={Languages}
          title="Language Settings"
          description={`${settings.user.language.firstLanguage} / ${settings.user.language.secondLanguage}`}
          onClick={() => onNavigate('language')}
        />
        
        <MenuCard
          icon={Phone}
          title="Calling Method"
          description={settings.user.callingMethod}
          onClick={() => onNavigate('calling')}
        />
        
        <MenuCard
          icon={Receipt}
          title="Receipt Settings"
          description="Department, Firm & Message lines"
          onClick={() => onNavigate('receipt')}
        />
        
        <MenuCard
          icon={Clock}
          title="Date & Time"
          description="Sync device time"
          onClick={() => onNavigate('datetime')}
        />
        
        <MenuCard
          icon={Ticket}
          title="Dispense Settings"
          description="Token start & jump settings"
          onClick={() => onNavigate('dispense')}
        />
        
        <MenuCard
          icon={Wifi}
          title="Wi-Fi Settings"
          description={isWiFiProtocol ? "Connect to network" : "Feature not available"}
          onClick={() => onNavigate('wifi')}
          disabled={!isWiFiProtocol}
          badge={!isWiFiProtocol ? "Disabled" : undefined}
        />
        
        <MenuCard
          icon={Info}
          title="Info"
          description="System information"
          onClick={() => onNavigate('info')}
        />
      </div>
    </PageContainer>
  );
};

export default UserSettingsMenu;
