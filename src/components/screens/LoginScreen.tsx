import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Lock, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { esp32Api } from '@/api/esp32';
import equeueLogo from '@/assets/equeue_logo.png';

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Please enter username and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await esp32Api.login({ username: username.trim(), password: password.trim() });
      
      if (response.success) {
        toast({
          title: "Login Successful",
          description: "Welcome to QMS Printer Configuration",
        });
        onLogin();
      } else {
        setError(response.error || 'Invalid username or password');
        toast({
          title: "Login Failed",
          description: response.error || "Invalid credentials. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      setError('Unable to connect to device');
      toast({
        title: "Connection Error",
        description: "Unable to connect to the device. Please check your connection.",
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo - matching splash screen style */}
        <div className="text-center mb-8">
          <div className="bg-white rounded-2xl px-6 py-4 mx-auto w-fit mb-4 shadow-lg">
            <img 
              src={equeueLogo} 
              alt="eQueue Logo" 
              className="h-12 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-primary-foreground">QMS Printer</h1>
          <p className="text-primary-foreground/70 text-sm mt-1">Configuration Panel</p>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="username" className="text-sm font-medium text-muted-foreground">
                Username
              </Label>
              <div className="relative mt-2">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError('');
                  }}
                  onKeyDown={handleKeyDown}
                  className="pl-10"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium text-muted-foreground">
                Password
              </Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  onKeyDown={handleKeyDown}
                  className="pl-10"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <Button 
              onClick={handleLogin} 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </div>
        </Card>

        <p className="text-center text-xs text-primary-foreground/60 mt-6">
          © 2024 eQueue Systems
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
