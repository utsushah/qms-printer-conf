import React from 'react';
import { Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SaveButtonProps {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  text?: string;
}

const SaveButton: React.FC<SaveButtonProps> = ({ 
  onClick, 
  loading = false, 
  disabled = false,
  text = 'Save Settings'
}) => {
  return (
    <Button 
      onClick={onClick} 
      disabled={disabled || loading}
      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-6 shadow-lg hover:shadow-xl transition-all"
    >
      {loading ? (
        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
      ) : (
        <Save className="h-5 w-5 mr-2" />
      )}
      {text}
    </Button>
  );
};

export default SaveButton;
