export type Language = 'English' | 'Hindi' | 'Gujarati';
export type CallingMethod = 'Next Button' | 'Call Button';
export type ServiceCode = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'H' | 'I' | 'J' | 'L' | 'N' | 'P' | 'Q' | 'T' | 'U' | 'Y';
export type ModelType = 'Easy' | 'Lite' | 'Classic';
export type PrinterModel = 'KP-628E' | 'EP-260C';
export type ProtocolType = 'Wi-Fi' | 'LAN' | 'RS485';
export type TokenLabel = 'Token No.' | 'Order No.' | 'File No.';
export type CounterLabel = 'Counter No.' | 'Room No.' | 'Desk No.';
export type DigitSetting = 3 | 4 | 5 | 6;

export interface LanguageSettings {
  firstLanguage: Language;
  secondLanguage: Language;
  tokenLabel: TokenLabel;
  counterLabel: CounterLabel;
}

export interface DepartmentSettings {
  enabled: boolean;
  name: string;
}

export interface FirmLineSettings {
  numberOfLines: number;
  lines: string[];
}

export interface MessageLineSettings {
  numberOfLines: number;
  lines: string[];
}

export interface ReceiptSettings {
  department: DepartmentSettings;
  firmLines: FirmLineSettings;
  messageLines: MessageLineSettings;
}

export interface DateTimeSettings {
  deviceDateTime: string;
  systemDateTime: string;
}

export interface TokenStartSettings {
  enabled: boolean;
  startNumber: number;
}

export interface DispenseSettings {
  tokenStart: Record<ServiceCode, TokenStartSettings>;
  jumpToService: ServiceCode | null;
  jumpToNumber: number;
}

export interface WiFiNetwork {
  ssid: string;
  strength: number;
  secured: boolean;
}

export interface WiFiSettings {
  connected: boolean;
  currentSSID: string;
  networks: WiFiNetwork[];
}

export interface NetworkInfo {
  ipAddress: string;
  subnetMask: string;
  gateway: string;
  dns: string;
}

export interface SystemInfo {
  systemInfo: string;
  softwareVersion: string;
  protocolType: ProtocolType;
  networkInfo: NetworkInfo;
  printerModel: PrinterModel;
}

export interface ServiceSettings {
  model: ModelType;
  activeServices: ServiceCode[];
}

export interface RemoteDevice {
  remoteId: string;
  serviceCode: ServiceCode;
}

export interface RemoteSettings {
  numberOfDevices: number;
  devices: RemoteDevice[];
}

export interface CounterDisplaySettings {
  enabled: boolean;
  numberOfDisplays: number;
  digitSetting: DigitSetting;
}

export interface WaitingAreaDisplaySettings {
  enabled: boolean;
  numberOfDisplays: number;
  digitSetting: DigitSetting;
}

export interface DisplaySettings {
  counterDisplay: CounterDisplaySettings;
  waitingAreaDisplay: WaitingAreaDisplaySettings;
}

export interface PrinterSettings {
  enabled: boolean;
  deviceModel: PrinterModel;
  tokenCopies: number;
  printerId: string;
}

export interface ManufacturingSettings {
  service: ServiceSettings;
  remote: RemoteSettings;
  display: DisplaySettings;
  printer: PrinterSettings;
  protocol: ProtocolType;
}

export interface UserSettings {
  language: LanguageSettings;
  callingMethod: CallingMethod;
  receipt: ReceiptSettings;
  dateTime: DateTimeSettings;
  dispense: DispenseSettings;
  wifi: WiFiSettings;
  info: SystemInfo;
}

export interface AllSettings {
  user: UserSettings;
  manufacturing: ManufacturingSettings;
}
