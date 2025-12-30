import React from 'react';
import { 
  Settings2, 
  Radio, 
  Monitor, 
  Printer, 
  Network, 
  Upload 
} from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import MenuCard from '@/components/layout/MenuCard';

interface ManufacturingMenuProps {
  onNavigate: (screen: string) => void;
  onBack: () => void;
}

const ManufacturingMenu: React.FC<ManufacturingMenuProps> = ({ onNavigate, onBack }) => {
  return (
    <PageContainer title="Manufacturing Settings" showBack onBack={onBack}>
      <div className="space-y-3">
        <MenuCard
          icon={Settings2}
          title="Service Setting"
          description="Model type & active services"
          onClick={() => onNavigate('mfg-service')}
        />
        
        <MenuCard
          icon={Radio}
          title="Remote Setting"
          description="Remote ID & service code"
          onClick={() => onNavigate('mfg-remote')}
        />
        
        <MenuCard
          icon={Monitor}
          title="Display Setting"
          description="Counter & waiting area displays"
          onClick={() => onNavigate('mfg-display')}
        />
        
        <MenuCard
          icon={Printer}
          title="Printer Setting"
          description="Device model & copies"
          onClick={() => onNavigate('mfg-printer')}
        />
        
        <MenuCard
          icon={Network}
          title="Protocol Setting"
          description="Wi-Fi, LAN or RS485"
          onClick={() => onNavigate('mfg-protocol')}
        />
        
        <MenuCard
          icon={Upload}
          title="Software Update"
          description="Upload firmware update"
          onClick={() => onNavigate('mfg-update')}
        />
      </div>
    </PageContainer>
  );
};

export default ManufacturingMenu;
