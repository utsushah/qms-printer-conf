import { 
  LanguageSettings, 
  CallingMethod, 
  ReceiptSettings, 
  DispenseSettings,
  ServiceSettings,
  RemoteSettings,
  DisplaySettings,
  PrinterSettings,
  ProtocolType,
  ServiceCode
} from '@/types/settings';
import { 
  getAuthHeaders, 
  setSession, 
  clearSession, 
  LoginCredentials, 
  LoginResponse 
} from '@/lib/auth';

const API_BASE = ''; // Empty for same-origin requests to ESP32

export interface ApiResponse {
  success: boolean;
  error?: string;
}

export interface RemoteReportData {
  date: string;
  remoteId: string;
  serviceCode: string;
  waitingTime: number; // in seconds
  servingTime: number; // in seconds
  turnaroundTime: number; // in seconds
  currentToken?: number;
  issuedTokens?: number;
}

// Helper function to get headers with authentication
const getRequestHeaders = (): Record<string, string> => {
  return {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
  };
};

// Helper function for POST requests with authentication
const postRequest = async <T>(endpoint: string, data: T): Promise<ApiResponse> => {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: getRequestHeaders(),
      body: JSON.stringify(data)
    });
    if (res.status === 401) {
      clearSession();
      throw new Error('Session expired. Please login again.');
    }
    if (!res.ok) throw new Error(`Failed to save to ${endpoint}`);
    return res.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Helper function for GET requests with authentication
const getRequest = async <T>(endpoint: string): Promise<T> => {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: getRequestHeaders(),
    });
    if (res.status === 401) {
      clearSession();
      throw new Error('Session expired. Please login again.');
    }
    if (!res.ok) throw new Error(`Failed to fetch from ${endpoint}`);
    return res.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const esp32Api = {
  // Authentication API - validates credentials on ESP32 device
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      const data = await res.json();
      
      if (data.success && data.token) {
        // Store session token (default 1 hour expiry if not specified)
        setSession(data.token, data.expiresIn || 3600);
      }
      
      return data;
    } catch (error) {
      console.error('Login Error:', error);
      // Fallback for demo/development when ESP32 is not available
      // In production, the ESP32 should handle all authentication
      return { success: false, error: 'Unable to connect to device' };
    }
  },

  // Logout - clear session
  async logout(): Promise<void> {
    try {
      await postRequest('/api/auth/logout', {});
    } catch {
      // Ignore errors, just clear local session
    }
    clearSession();
  },

  // Manufacturing access verification - validates on ESP32
  async verifyManufacturingAccess(password: string): Promise<ApiResponse> {
    return postRequest('/api/auth/manufacturing', { password });
  },

  // GET - Fetch all settings at once
  async getSettings() {
    return getRequest('/api/settings');
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

  // Jump to Token API
  async jumpToToken(service: ServiceCode, tokenNumber: number): Promise<ApiResponse> {
    return postRequest('/api/dispense/jump', { service, tokenNumber });
  },

  // WiFi APIs
  async scanWifi(): Promise<{ networks: Array<{ ssid: string; strength: number; secured: boolean }>; connectedSSID: string | null }> {
    return getRequest('/api/wifi/scan');
  },

  async connectWifi(ssid: string, password: string): Promise<{ success: boolean; status?: string; currentSSID?: string; error?: string }> {
    return postRequest('/api/wifi/connect', { ssid, password }) as Promise<{ success: boolean; status?: string; currentSSID?: string; error?: string }>;
  },

  async getWifiStatus(): Promise<{ connected: boolean; status?: string; currentSSID?: string }> {
    return getRequest('/api/wifi/status');
  },

  // DateTime APIs
  async getDateTime(): Promise<{ timestamp: number }> {
    return getRequest('/api/datetime');
  },

  async syncDateTime(): Promise<ApiResponse> {
    return postRequest('/api/datetime/sync', { timestamp: Math.floor(Date.now() / 1000) });
  },

  // System Info API
  async getSystemInfo(): Promise<{ systemInfo: string; softwareVersion: string; protocolType: string }> {
    return getRequest('/api/info');
  },

  // Firmware Update API
  async uploadFirmware(file: File, onProgress?: (progress: number) => void): Promise<ApiResponse> {
    try {
      const xhr = new XMLHttpRequest();
      const authHeaders = getAuthHeaders();

      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable && onProgress) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 401) {
            clearSession();
            reject(new Error('Session expired. Please login again.'));
            return;
          }
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error('Upload failed'));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Upload failed')));

        xhr.open('POST', `${API_BASE}/api/firmware/update`);
        
        // Set auth header if available
        if (authHeaders.Authorization) {
          xhr.setRequestHeader('Authorization', authHeaders.Authorization);
        }
        
        xhr.send(file);
      });
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Factory Reset API
  async factoryReset(): Promise<ApiResponse> {
    return postRequest('/api/system/factory-reset', {});
  },

  // Report APIs
  async getRemoteReport(startDate: string, endDate: string): Promise<RemoteReportData[]> {
    try {
      return await getRequest(`/api/report/remote?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`);
    } catch (error) {
      console.error('API Error:', error);
      // Return empty array for demo
      return [];
    }
  },

  // Logo GET API - fetches stored logo.bin and renders to data URL
  async getLogo(): Promise<{ dataUrl: string; width: number; height: number } | null> {
    try {
      const res = await fetch(`${API_BASE}/api/settings/logo`, {
        headers: getAuthHeaders(),
      });
      if (res.status === 401) { clearSession(); throw new Error('Session expired.'); }
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Failed to fetch logo');
      const width = parseInt(res.headers.get('X-Logo-Width') || '0', 10);
      const height = parseInt(res.headers.get('X-Logo-Height') || '0', 10);
      const buffer = await res.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      const imgData = ctx.createImageData(width, height);
      const widthBytes = width / 8;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const byteIdx = y * widthBytes + Math.floor(x / 8);
          const bitIdx = 7 - (x % 8);
          const isBlack = (bytes[byteIdx] >> bitIdx) & 1;
          const val = isBlack ? 0 : 255;
          const pIdx = (y * width + x) * 4;
          imgData.data[pIdx] = val;
          imgData.data[pIdx + 1] = val;
          imgData.data[pIdx + 2] = val;
          imgData.data[pIdx + 3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
      return { dataUrl: canvas.toDataURL('image/png'), width, height };
    } catch (error) {
      console.error('API Error:', error);
      return null;
    }
  },

  // Logo DELETE API - removes stored logo from ESP32
  async deleteLogo(): Promise<ApiResponse> {
    try {
      const res = await fetch(`${API_BASE}/api/settings/logo`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.status === 401) { clearSession(); throw new Error('Session expired.'); }
      if (!res.ok) throw new Error('Failed to delete logo');
      return res.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Logo Upload API - sends raw monochrome raster binary to ESP32
  async uploadLogo(binBlob: Blob, width: number, height: number, onProgress?: (progress: number) => void): Promise<ApiResponse> {
    try {
      const xhr = new XMLHttpRequest();
      const authHeaders = getAuthHeaders();

      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable && onProgress) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 401) {
            clearSession();
            reject(new Error('Session expired. Please login again.'));
            return;
          }
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error('Logo upload failed'));
          }
        });
        xhr.addEventListener('error', () => reject(new Error('Logo upload failed')));
        xhr.open('POST', `${API_BASE}/api/settings/logo`);
        if (authHeaders.Authorization) {
          xhr.setRequestHeader('Authorization', authHeaders.Authorization);
        }
        xhr.setRequestHeader('Content-Type', 'application/octet-stream');
        xhr.setRequestHeader('X-Logo-Width', String(width));
        xhr.setRequestHeader('X-Logo-Height', String(height));
        xhr.send(binBlob);
      });
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  async exportRemoteReport(startDate: string, endDate: string): Promise<Blob> {
    try {
      const res = await fetch(
        `${API_BASE}/api/report/remote/export?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`,
        { headers: getRequestHeaders() }
      );
      if (res.status === 401) {
        clearSession();
        throw new Error('Session expired. Please login again.');
      }
      if (!res.ok) throw new Error('Failed to export report');
      return res.blob();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
};
