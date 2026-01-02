import { 
  LanguageSettings, 
  CallingMethod, 
  ReceiptSettings, 
  DispenseSettings,
  ServiceSettings,
  RemoteSettings,
  DisplaySettings,
  PrinterSettings,
  ProtocolType
} from '@/types/settings';

const API_BASE = ''; // Empty for same-origin requests to ESP32

export interface ApiResponse {
  success: boolean;
  error?: string;
}

// Helper function for POST requests
const postRequest = async <T>(endpoint: string, data: T): Promise<ApiResponse> => {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`Failed to save to ${endpoint}`);
    return res.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const esp32Api = {
  // GET - Fetch all settings at once
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

  // Individual POST APIs for each setting
  async saveLanguageSettings(settings: LanguageSettings): Promise<ApiResponse> {
    return postRequest('/api/settings/language', settings);
  },

  async saveCallingMethod(method: CallingMethod): Promise<ApiResponse> {
    return postRequest('/api/settings/calling-method', { method });
  },

  async saveReceiptSettings(settings: ReceiptSettings): Promise<ApiResponse> {
    return postRequest('/api/settings/receipt', settings);
  },

  async saveDispenseSettings(settings: DispenseSettings): Promise<ApiResponse> {
    return postRequest('/api/settings/dispense', settings);
  },

  async saveServiceSettings(settings: ServiceSettings): Promise<ApiResponse> {
    return postRequest('/api/settings/service', settings);
  },

  async saveRemoteSettings(settings: RemoteSettings): Promise<ApiResponse> {
    return postRequest('/api/settings/remote', settings);
  },

  async saveDisplaySettings(settings: DisplaySettings): Promise<ApiResponse> {
    return postRequest('/api/settings/display', settings);
  },

  async savePrinterSettings(settings: PrinterSettings): Promise<ApiResponse> {
    return postRequest('/api/settings/printer', settings);
  },

  async saveProtocolSettings(protocol: ProtocolType): Promise<ApiResponse> {
    return postRequest('/api/settings/protocol', { protocol });
  },

  // WiFi APIs
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
    return postRequest('/api/wifi/connect', { ssid, password });
  },

  // DateTime APIs
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
    return postRequest('/api/datetime/sync', { timestamp: Math.floor(Date.now() / 1000) });
  },

  // System Info API
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

  // Firmware Update API
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
