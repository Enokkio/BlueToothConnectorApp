export type PeripheralServices = {
    peripheralId: string;
    serviceId: string;
    transfer: string;
    receive: string;
    characteristics?: Array<{
    characteristic: string;
    service: string;
    properties: Record<string, string>;
  }>;
};
  
export interface StrippedPeripheral {
    name?: string;
    localName?: string;
    rssi: number;
    id: string;
    advertising?: {
    isConnectable?: boolean;
    serviceUUIDs?: string[];
    manufacturerData?: string;
    txPowerLevel?: number;
  };
    
}