const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '');

const getApiBase = () => {
  // Priority:
  // 1) localStorage override (useful when running this UI from Lovable/Vite preview)
  // 2) Vite env var (VITE_ESP32_BASE_URL)
  // 3) empty string for same-origin (when UI is served directly by ESP32)
  try {
    const fromStorage = localStorage.getItem('ESP32_BASE_URL');
    if (fromStorage && fromStorage.trim()) return normalizeBaseUrl(fromStorage.trim());
  } catch {
    // ignore (SSR / storage blocked)
  }

  // Note: import.meta.env is always defined in Vite builds
  const fromEnv = (import.meta as any)?.env?.VITE_ESP32_BASE_URL as string | undefined;
  if (fromEnv && fromEnv.trim()) return normalizeBaseUrl(fromEnv.trim());

  return '';
};

export interface ApiResponse {
  success: boolean;
  error?: string;
}

const parseJsonOrThrow = async <T>(res: Response): Promise<T> => {
  const contentType = res.headers.get('content-type') || '';

  // When /api is not proxied to the ESP32, Vite/Lovable returns index.html (text/html)
  if (contentType.includes('text/html')) {
    const text = await res.text();
    const prefix = text.slice(0, 60).replace(/\s+/g, ' ');
    throw new Error(
      `ESP32 API is not reachable (got HTML). Configure a proxy or set ESP32_BASE_URL. Received: "${prefix}..."`
    );
  }

  // If the ESP32 returned JSON, parse it; otherwise read text for a helpful error
  if (contentType.includes('application/json')) {
    return res.json() as Promise<T>;
  }

  const text = await res.text();
  throw new Error(`Unexpected response (${res.status}). ${text.slice(0, 120)}`);
};

const apiFetch = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const base = getApiBase();
  const res = await fetch(`${base}${path}`, init);
  if (!res.ok) {
    // still try to parse JSON error payloads if any
    try {
      return await parseJsonOrThrow<T>(res);
    } catch {
      throw new Error(`Request failed: ${res.status} ${res.statusText}`);
    }
  }
  return parseJsonOrThrow<T>(res);
};

export const esp32Api = {
  // ===== Legacy (all-in-one) =====
  async getSettings() {
    try {
      return await apiFetch<any>(`/api/settings`);
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  async saveSettings(settings: Record<string, unknown>): Promise<ApiResponse> {
    try {
      return await apiFetch<ApiResponse>(`/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // ===== Split endpoints (recommended) =====
  async getUserSettings() {
    try {
      return await apiFetch<any>(`/api/settings/user`);
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  async saveUserSettings(user: Record<string, unknown>): Promise<ApiResponse> {
    try {
      return await apiFetch<ApiResponse>(`/api/settings/user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  async getManufacturingSettings() {
    try {
      return await apiFetch<any>(`/api/settings/manufacturing`);
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  async saveManufacturingSettings(manufacturing: Record<string, unknown>): Promise<ApiResponse> {
    try {
      return await apiFetch<ApiResponse>(`/api/settings/manufacturing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manufacturing),
      });
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  async scanWifi(): Promise<Array<{ ssid: string; strength: number; secured: boolean }>> {
    try {
      return await apiFetch(`/api/wifi/scan`);
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  async connectWifi(ssid: string, password: string): Promise<ApiResponse> {
    try {
      return await apiFetch<ApiResponse>(`/api/wifi/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ssid, password }),
      });
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  async getDateTime(): Promise<{ timestamp: number }> {
    try {
      return await apiFetch(`/api/datetime`);
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  async syncDateTime(): Promise<ApiResponse> {
    try {
      return await apiFetch<ApiResponse>(`/api/datetime/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timestamp: Math.floor(Date.now() / 1000) }),
      });
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  async getSystemInfo(): Promise<{ systemInfo: string; softwareVersion: string; protocolType: string }> {
    try {
      return await apiFetch(`/api/info`);
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  async uploadFirmware(file: File, onProgress?: (progress: number) => void): Promise<ApiResponse> {
    try {
      const base = getApiBase();
      const xhr = new XMLHttpRequest();

      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable && onProgress) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener('load', () => {
          const contentType = xhr.getResponseHeader('content-type') || '';
          if (xhr.status >= 200 && xhr.status < 300) {
            if (contentType.includes('application/json')) {
              resolve(JSON.parse(xhr.responseText));
              return;
            }
            if (contentType.includes('text/html')) {
              reject(new Error('ESP32 API is not reachable (got HTML).'));
              return;
            }
            resolve({ success: true });
          } else {
            reject(new Error('Upload failed'));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Upload failed')));

        xhr.open('POST', `${base}/api/firmware/update`);
        xhr.send(file);
      });
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
};
