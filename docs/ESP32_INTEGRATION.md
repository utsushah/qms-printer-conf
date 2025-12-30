# ESP32-S3 Integration Guide for eQueue QMS Printer Settings

This document explains how to integrate the HTML settings interface with your ESP32-S3 using ESP-IDF.

## Overview

The settings interface communicates with the ESP32-S3 via HTTP endpoints. The ESP32-S3 should host a web server that serves this HTML interface and handles API requests.

## Required ESP-IDF Components

```c
#include "esp_http_server.h"
#include "esp_wifi.h"
#include "nvs_flash.h"
#include "esp_spiffs.h"
#include "cJSON.h"
```

## Data Structures

```c
// settings.h

typedef struct {
    char first_language[16];
    char second_language[16];
} language_settings_t;

typedef struct {
    char calling_method[16]; // "Next Button" or "Call Button"
} calling_method_settings_t;

typedef struct {
    bool enabled;
    char name[17]; // 16 chars + null
} department_settings_t;

typedef struct {
    uint8_t number_of_lines;
    char lines[4][17]; // max 4 lines, 16 chars each + null
} firm_line_settings_t;

typedef struct {
    uint8_t number_of_lines;
    char lines[4][17];
} message_line_settings_t;

typedef struct {
    department_settings_t department;
    firm_line_settings_t firm_lines;
    message_line_settings_t message_lines;
} receipt_settings_t;

typedef struct {
    bool enabled;
    uint16_t start_number;
} token_start_settings_t;

typedef struct {
    token_start_settings_t services[10]; // A,C,E,F,H,J,L,P,U,Y
    char jump_to_service;
    uint16_t jump_to_number;
} dispense_settings_t;

typedef struct {
    char model[8]; // "Easy", "Lite", "Classic"
    uint8_t active_services; // bitmap for A,C,E,F,H,J,L,P,U,Y
} service_settings_t;

typedef struct {
    char remote_id[32];
    char service_code;
} remote_settings_t;

typedef struct {
    bool counter_enabled;
    uint8_t counter_count;
    bool waiting_enabled;
    uint8_t waiting_count;
} display_settings_t;

typedef struct {
    char device_model[16]; // "KP-628E" or "EP-260C"
    uint8_t token_copies;
} printer_settings_t;

typedef struct {
    char protocol[8]; // "Wi-Fi", "LAN", "RS485"
} protocol_settings_t;

typedef struct {
    language_settings_t language;
    calling_method_settings_t calling;
    receipt_settings_t receipt;
    dispense_settings_t dispense;
} user_settings_t;

typedef struct {
    service_settings_t service;
    remote_settings_t remote;
    display_settings_t display;
    printer_settings_t printer;
    protocol_settings_t protocol;
} manufacturing_settings_t;

typedef struct {
    user_settings_t user;
    manufacturing_settings_t manufacturing;
} all_settings_t;
```

## HTTP Server Endpoints

```c
// main.c

#include "esp_http_server.h"
#include "cJSON.h"
#include "settings.h"

static all_settings_t g_settings;

// GET /api/settings - Return all settings
static esp_err_t get_settings_handler(httpd_req_t *req) {
    cJSON *root = cJSON_CreateObject();
    
    // User settings
    cJSON *user = cJSON_CreateObject();
    cJSON *lang = cJSON_CreateObject();
    cJSON_AddStringToObject(lang, "firstLanguage", g_settings.user.language.first_language);
    cJSON_AddStringToObject(lang, "secondLanguage", g_settings.user.language.second_language);
    cJSON_AddItemToObject(user, "language", lang);
    cJSON_AddStringToObject(user, "callingMethod", g_settings.user.calling.calling_method);
    
    // Add receipt settings
    cJSON *receipt = cJSON_CreateObject();
    cJSON *dept = cJSON_CreateObject();
    cJSON_AddBoolToObject(dept, "enabled", g_settings.user.receipt.department.enabled);
    cJSON_AddStringToObject(dept, "name", g_settings.user.receipt.department.name);
    cJSON_AddItemToObject(receipt, "department", dept);
    cJSON_AddItemToObject(user, "receipt", receipt);
    
    cJSON_AddItemToObject(root, "user", user);
    
    // Manufacturing settings
    cJSON *mfg = cJSON_CreateObject();
    cJSON_AddStringToObject(mfg, "protocol", g_settings.manufacturing.protocol.protocol);
    cJSON_AddItemToObject(root, "manufacturing", mfg);
    
    char *json_str = cJSON_Print(root);
    httpd_resp_set_type(req, "application/json");
    httpd_resp_send(req, json_str, strlen(json_str));
    
    free(json_str);
    cJSON_Delete(root);
    return ESP_OK;
}

// POST /api/settings - Save settings
static esp_err_t post_settings_handler(httpd_req_t *req) {
    char buf[2048];
    int ret = httpd_req_recv(req, buf, sizeof(buf) - 1);
    if (ret <= 0) {
        return ESP_FAIL;
    }
    buf[ret] = '\0';
    
    cJSON *root = cJSON_Parse(buf);
    if (root == NULL) {
        httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Invalid JSON");
        return ESP_FAIL;
    }
    
    // Parse and save settings
    cJSON *user = cJSON_GetObjectItem(root, "user");
    if (user) {
        cJSON *lang = cJSON_GetObjectItem(user, "language");
        if (lang) {
            cJSON *first = cJSON_GetObjectItem(lang, "firstLanguage");
            cJSON *second = cJSON_GetObjectItem(lang, "secondLanguage");
            if (first) strncpy(g_settings.user.language.first_language, first->valuestring, 15);
            if (second) strncpy(g_settings.user.language.second_language, second->valuestring, 15);
        }
        
        cJSON *calling = cJSON_GetObjectItem(user, "callingMethod");
        if (calling) {
            strncpy(g_settings.user.calling.calling_method, calling->valuestring, 15);
        }
    }
    
    // Save to NVS
    save_settings_to_nvs(&g_settings);
    
    cJSON_Delete(root);
    httpd_resp_sendstr(req, "{\"success\":true}");
    return ESP_OK;
}

// GET /api/wifi/scan - Scan WiFi networks
static esp_err_t wifi_scan_handler(httpd_req_t *req) {
    wifi_scan_config_t scan_config = {
        .show_hidden = false,
        .scan_type = WIFI_SCAN_TYPE_ACTIVE
    };
    
    esp_wifi_scan_start(&scan_config, true);
    
    uint16_t ap_count = 0;
    esp_wifi_scan_get_ap_num(&ap_count);
    
    wifi_ap_record_t *ap_list = malloc(sizeof(wifi_ap_record_t) * ap_count);
    esp_wifi_scan_get_ap_records(&ap_count, ap_list);
    
    cJSON *root = cJSON_CreateArray();
    for (int i = 0; i < ap_count; i++) {
        cJSON *ap = cJSON_CreateObject();
        cJSON_AddStringToObject(ap, "ssid", (char*)ap_list[i].ssid);
        cJSON_AddNumberToObject(ap, "strength", ap_list[i].rssi + 100);
        cJSON_AddBoolToObject(ap, "secured", ap_list[i].authmode != WIFI_AUTH_OPEN);
        cJSON_AddItemToArray(root, ap);
    }
    
    char *json_str = cJSON_Print(root);
    httpd_resp_set_type(req, "application/json");
    httpd_resp_send(req, json_str, strlen(json_str));
    
    free(json_str);
    free(ap_list);
    cJSON_Delete(root);
    return ESP_OK;
}

// POST /api/wifi/connect - Connect to WiFi
static esp_err_t wifi_connect_handler(httpd_req_t *req) {
    char buf[256];
    int ret = httpd_req_recv(req, buf, sizeof(buf) - 1);
    if (ret <= 0) return ESP_FAIL;
    buf[ret] = '\0';
    
    cJSON *root = cJSON_Parse(buf);
    cJSON *ssid = cJSON_GetObjectItem(root, "ssid");
    cJSON *password = cJSON_GetObjectItem(root, "password");
    
    wifi_config_t wifi_config = {0};
    strncpy((char*)wifi_config.sta.ssid, ssid->valuestring, 32);
    if (password) {
        strncpy((char*)wifi_config.sta.password, password->valuestring, 64);
    }
    
    esp_wifi_set_config(WIFI_IF_STA, &wifi_config);
    esp_wifi_connect();
    
    cJSON_Delete(root);
    httpd_resp_sendstr(req, "{\"success\":true}");
    return ESP_OK;
}

// GET /api/datetime - Get device date/time
static esp_err_t get_datetime_handler(httpd_req_t *req) {
    time_t now;
    time(&now);
    
    cJSON *root = cJSON_CreateObject();
    cJSON_AddNumberToObject(root, "timestamp", now);
    
    char *json_str = cJSON_Print(root);
    httpd_resp_set_type(req, "application/json");
    httpd_resp_send(req, json_str, strlen(json_str));
    
    free(json_str);
    cJSON_Delete(root);
    return ESP_OK;
}

// POST /api/datetime/sync - Sync device time
static esp_err_t sync_datetime_handler(httpd_req_t *req) {
    char buf[64];
    int ret = httpd_req_recv(req, buf, sizeof(buf) - 1);
    if (ret <= 0) return ESP_FAIL;
    buf[ret] = '\0';
    
    cJSON *root = cJSON_Parse(buf);
    cJSON *timestamp = cJSON_GetObjectItem(root, "timestamp");
    
    if (timestamp) {
        struct timeval tv = {
            .tv_sec = (time_t)timestamp->valuedouble,
            .tv_usec = 0
        };
        settimeofday(&tv, NULL);
    }
    
    cJSON_Delete(root);
    httpd_resp_sendstr(req, "{\"success\":true}");
    return ESP_OK;
}

// POST /api/firmware/update - OTA firmware update
static esp_err_t firmware_update_handler(httpd_req_t *req) {
    esp_ota_handle_t update_handle = 0;
    const esp_partition_t *update_partition = esp_ota_get_next_update_partition(NULL);
    
    esp_err_t err = esp_ota_begin(update_partition, OTA_SIZE_UNKNOWN, &update_handle);
    if (err != ESP_OK) {
        httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "OTA begin failed");
        return ESP_FAIL;
    }
    
    char buf[1024];
    int received;
    while ((received = httpd_req_recv(req, buf, sizeof(buf))) > 0) {
        esp_ota_write(update_handle, buf, received);
    }
    
    err = esp_ota_end(update_handle);
    if (err != ESP_OK) {
        httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "OTA end failed");
        return ESP_FAIL;
    }
    
    esp_ota_set_boot_partition(update_partition);
    httpd_resp_sendstr(req, "{\"success\":true}");
    
    // Restart after sending response
    vTaskDelay(1000 / portTICK_PERIOD_MS);
    esp_restart();
    
    return ESP_OK;
}

// Register all HTTP handlers
httpd_handle_t start_webserver(void) {
    httpd_config_t config = HTTPD_DEFAULT_CONFIG();
    config.max_uri_handlers = 16;
    config.uri_match_fn = httpd_uri_match_wildcard;
    
    httpd_handle_t server = NULL;
    if (httpd_start(&server, &config) == ESP_OK) {
        // Settings endpoints
        httpd_uri_t get_settings = {
            .uri = "/api/settings",
            .method = HTTP_GET,
            .handler = get_settings_handler
        };
        httpd_register_uri_handler(server, &get_settings);
        
        httpd_uri_t post_settings = {
            .uri = "/api/settings",
            .method = HTTP_POST,
            .handler = post_settings_handler
        };
        httpd_register_uri_handler(server, &post_settings);
        
        // WiFi endpoints
        httpd_uri_t wifi_scan = {
            .uri = "/api/wifi/scan",
            .method = HTTP_GET,
            .handler = wifi_scan_handler
        };
        httpd_register_uri_handler(server, &wifi_scan);
        
        httpd_uri_t wifi_connect = {
            .uri = "/api/wifi/connect",
            .method = HTTP_POST,
            .handler = wifi_connect_handler
        };
        httpd_register_uri_handler(server, &wifi_connect);
        
        // DateTime endpoints
        httpd_uri_t get_datetime = {
            .uri = "/api/datetime",
            .method = HTTP_GET,
            .handler = get_datetime_handler
        };
        httpd_register_uri_handler(server, &get_datetime);
        
        httpd_uri_t sync_datetime = {
            .uri = "/api/datetime/sync",
            .method = HTTP_POST,
            .handler = sync_datetime_handler
        };
        httpd_register_uri_handler(server, &sync_datetime);
        
        // Firmware update
        httpd_uri_t firmware = {
            .uri = "/api/firmware/update",
            .method = HTTP_POST,
            .handler = firmware_update_handler
        };
        httpd_register_uri_handler(server, &firmware);
        
        // Serve static files from SPIFFS
        httpd_uri_t static_files = {
            .uri = "/*",
            .method = HTTP_GET,
            .handler = static_file_handler
        };
        httpd_register_uri_handler(server, &static_files);
    }
    
    return server;
}
```

## NVS Settings Storage

```c
// nvs_settings.c

#include "nvs_flash.h"
#include "settings.h"

#define NVS_NAMESPACE "qms_settings"

esp_err_t save_settings_to_nvs(all_settings_t *settings) {
    nvs_handle_t handle;
    esp_err_t err = nvs_open(NVS_NAMESPACE, NVS_READWRITE, &handle);
    if (err != ESP_OK) return err;
    
    err = nvs_set_blob(handle, "settings", settings, sizeof(all_settings_t));
    if (err == ESP_OK) {
        nvs_commit(handle);
    }
    
    nvs_close(handle);
    return err;
}

esp_err_t load_settings_from_nvs(all_settings_t *settings) {
    nvs_handle_t handle;
    esp_err_t err = nvs_open(NVS_NAMESPACE, NVS_READONLY, &handle);
    if (err != ESP_OK) {
        // Load defaults
        init_default_settings(settings);
        return ESP_OK;
    }
    
    size_t size = sizeof(all_settings_t);
    err = nvs_get_blob(handle, "settings", settings, &size);
    
    nvs_close(handle);
    
    if (err != ESP_OK) {
        init_default_settings(settings);
    }
    
    return ESP_OK;
}

void init_default_settings(all_settings_t *settings) {
    memset(settings, 0, sizeof(all_settings_t));
    
    strcpy(settings->user.language.first_language, "English");
    strcpy(settings->user.language.second_language, "Hindi");
    strcpy(settings->user.calling.calling_method, "Next Button");
    
    strcpy(settings->manufacturing.service.model, "Lite");
    settings->manufacturing.service.active_services = 0x0F; // A,C,E,F active
    
    strcpy(settings->manufacturing.printer.device_model, "KP-628E");
    settings->manufacturing.printer.token_copies = 1;
    
    strcpy(settings->manufacturing.protocol.protocol, "Wi-Fi");
}
```

## Building the Web Interface

1. Build the React app:
   ```bash
   npm run build
   ```

2. Convert to SPIFFS image:
   ```bash
   python $IDF_PATH/components/spiffs/spiffsgen.py 0x100000 dist spiffs.bin
   ```

3. Flash to ESP32-S3:
   ```bash
   esptool.py --port /dev/ttyUSB0 write_flash 0x110000 spiffs.bin
   ```

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/settings | Get all settings |
| POST | /api/settings | Save settings |
| GET | /api/wifi/scan | Scan WiFi networks |
| POST | /api/wifi/connect | Connect to WiFi |
| GET | /api/datetime | Get device time |
| POST | /api/datetime/sync | Sync device time |
| POST | /api/firmware/update | Upload firmware |
| GET | /api/info | Get system info |

## Frontend Integration

To connect the React frontend to these endpoints, update the API calls in your components. Example:

```typescript
// src/api/esp32.ts

const API_BASE = ''; // Empty for same-origin requests to ESP32

export const api = {
  async getSettings() {
    const res = await fetch(`${API_BASE}/api/settings`);
    return res.json();
  },
  
  async saveSettings(settings: AllSettings) {
    const res = await fetch(`${API_BASE}/api/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    return res.json();
  },
  
  async scanWifi() {
    const res = await fetch(`${API_BASE}/api/wifi/scan`);
    return res.json();
  },
  
  async connectWifi(ssid: string, password: string) {
    const res = await fetch(`${API_BASE}/api/wifi/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ssid, password })
    });
    return res.json();
  },
  
  async syncTime() {
    const res = await fetch(`${API_BASE}/api/datetime/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timestamp: Math.floor(Date.now() / 1000) })
    });
    return res.json();
  },
  
  async uploadFirmware(file: File) {
    const res = await fetch(`${API_BASE}/api/firmware/update`, {
      method: 'POST',
      body: file
    });
    return res.json();
  }
};
```
