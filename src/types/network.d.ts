export interface NetworkContextType {
  isConnected: boolean;
  connectionType: string | null;
  networkDetails: any;
}

export interface NetworkStatus {
  isOnline: boolean;
  type: string | null;
  isWifiConnected: boolean;
  isCellularConnected: boolean;
}