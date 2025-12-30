const API_BASE = ''; // Empty for same-origin requests to ESP32

export interface ApiResponse {
  success: boolean;
  error?: string;
}

export const esp32Api = {
  async getSettings() {
    try {
      const res = await fetch(`${API_BASE}/api/settings`);
      if (!res.ok) throw new Error('Failed to fetch settings');
      return res.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
  
  async saveSettings(settings: Record<string, unknown>): Promise<ApiResponse> {
    try {
      const res = await fetch(`${API_BASE}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (!res.ok) throw new Error('Failed to save settings');
      return res.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
  
  async scanWifi(): Promise<Array<{ ssid: string; strength: number; secured: boolean }>> {
    try {
      const res = await fetch(`${API_BASE}/api/wifi/scan`);
      if (!res.ok) throw new Error('Failed to scan WiFi');
      return res.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
  
  async connectWifi(ssid: string, password: string): Promise<ApiResponse> {
    try {
      const res = await fetch(`${API_BASE}/api/wifi/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ssid, password })
      });
      if (!res.ok) throw new Error('Failed to connect to WiFi');
      return res.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
  
  async getDateTime(): Promise<{ timestamp: number }> {
    try {
      const res = await fetch(`${API_BASE}/api/datetime`);
      if (!res.ok) throw new Error('Failed to get datetime');
      return res.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
  
  async syncDateTime(): Promise<ApiResponse> {
    try {
      const res = await fetch(`${API_BASE}/api/datetime/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timestamp: Math.floor(Date.now() / 1000) })
      });
      if (!res.ok) throw new Error('Failed to sync datetime');
      return res.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
  
  async getSystemInfo(): Promise<{ systemInfo: string; softwareVersion: string; protocolType: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/info`);
      if (!res.ok) throw new Error('Failed to get system info');
      return res.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
  
  async uploadFirmware(file: File, onProgress?: (progress: number) => void): Promise<ApiResponse> {
    try {
      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable && onProgress) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        });
        
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error('Upload failed'));
          }
        });
        
        xhr.addEventListener('error', () => reject(new Error('Upload failed')));
        
        xhr.open('POST', `${API_BASE}/api/firmware/update`);
        xhr.send(file);
      });
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
};
