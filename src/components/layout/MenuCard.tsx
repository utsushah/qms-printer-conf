import React from 'react';
import { ChevronRight, LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface MenuCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  onClick: () => void;
  badge?: string;
  disabled?: boolean;
}

const MenuCard: React.FC<MenuCardProps> = ({ 
  icon: Icon, 
  title, 
  description, 
  onClick, 
  badge,
  disabled = false 
}) => {
  return (
    <Card 
      className={`p-4 flex items-center gap-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30 active:scale-[0.98] ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={disabled ? undefined : onClick}
    >
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-foreground truncate">{title}</h3>
          {badge && (
            <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground truncate">{description}</p>
        )}
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
    </Card>
  );
};

export default MenuCard;
