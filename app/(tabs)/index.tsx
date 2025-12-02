import ConnectedState from "@/components/bluetooth/ConnectedState";
import DisconnectedState from "@/components/bluetooth/DisconnectedState";
import { PeripheralServices } from "@/types/bluetooth";
import { handleAndroidPermissions } from "@/utils/permission";
import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Platform, Alert, Linking } from "react-native";
import BleManager, {
  BleDisconnectPeripheralEvent,
  BleManagerDidUpdateValueForCharacteristicEvent,
  BleScanCallbackType,
  BleScanMatchMode,
  BleScanMode,
  Peripheral,
} from "react-native-ble-manager";

declare module "react-native-ble-manager" {
  interface Peripheral {
    connected?: boolean;
    connecting?: boolean;
    lastSeen?: number; // timestamp for last discovery
  }
}

const SECONDS_TO_SCAN_FOR = 5;
const SERVICE_UUIDS: string[] = [];
const ALLOW_DUPLICATES = true;

const DEVICE_SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const TRANSFER_CHARACTERISTIC_UUID = "beb5483f-36e1-4688-b7f5-ea07361b26a9";
const RECEIVE_CHARACTERISTIC_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";

const BluetoothDemoScreen: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [peripherals, setPeripherals] = useState(
    new Map<Peripheral["id"], Peripheral>()
  );
  const [isConnected, setIsConnected] = useState(false);
  const [bleService, setBleService] = useState<PeripheralServices | undefined>(
    undefined
  );
  const [RSSITrackValues, setRSSITrackValues] = useState<number[]>([]);
  // const localTrackerID = useRef<string>("E4:17:D8:88:30:C1"); // replace with your tracker ID
  const [localTrackerID, setlocalTrackerID] = useState<string>("E4:17:D8:88:30:C1");

  useEffect(() => {
    BleManager.start({ showAlert: false })
      .then(() => console.debug("BleManager started."))
      .catch((error: any) =>
        console.error("BleManager could not be started.", error)
      );

    const listeners: any[] = [
      BleManager.onDiscoverPeripheral(handleDiscoverPeripheral),
      BleManager.onStopScan(handleStopScan),
      BleManager.onConnectPeripheral(handleConnectPeripheral),
      BleManager.onDidUpdateValueForCharacteristic(
        handleUpdateValueForCharacteristic
      ),
      BleManager.onDisconnectPeripheral(handleDisconnectedPeripheral),
    ];

    handleAndroidPermissions();

    return () => {
      for (const listener of listeners) {
        listener.remove();
      }
    };
  }, []);

  const handleDiscoverPeripheral = (peripheral: Peripheral) => {
    if (!peripheral.name) peripheral.name = "NO NAME";

    // Mark last seen timestamp
    peripheral.lastSeen = Date.now();

    setPeripherals((map) => new Map(map.set(peripheral.id, peripheral)));

    // Append RSSI only if this is the device we want to track
    if (peripheral.id === localTrackerID) {
      setRSSITrackValues((prev) => [...prev, peripheral.rssi]);
      console.log("RSSI values:", [...RSSITrackValues, peripheral.rssi]);
    }
  };

  const handleStopScan = () => {
    setIsScanning(false);
    console.debug("[handleStopScan] scan is stopped.");
  };

  const handleConnectPeripheral = (event: any) => {
    console.log(`[handleConnectPeripheral][${event.peripheral}] connected.`);
  };

  const handleUpdateValueForCharacteristic = async (
    data: BleManagerDidUpdateValueForCharacteristicEvent
  ) => {
    console.debug(
      `[handleUpdateValueForCharacteristic] received data from '${data.peripheral}' with characteristic='${data.characteristic}' and value='${data.value}====='`
    );
  };

  const handleDisconnectedPeripheral = (event: BleDisconnectPeripheralEvent) => {
    console.debug(`[handleDisconnectedPeripheral][${event.peripheral}] disconnected.`);
    setPeripherals((map) => {
      const p = map.get(event.peripheral);
      if (p) {
        p.connected = false;
        return new Map(map.set(event.peripheral, p));
      }
      return map;
    });
    setIsConnected(false);
    setBleService(undefined);
  };

  const connectPeripheral = async (peripheral: Omit<Peripheral, "advertising">) => {
    try {
      setPeripherals((map) => {
        const p = map.get(peripheral.id);
        if (p) {
          p.connecting = true;
          return new Map(map.set(p.id, p));
        }
        return map;
      });

      await BleManager.connect(peripheral.id);

      setPeripherals((map) => {
        const p = map.get(peripheral.id);
        if (p) {
          p.connecting = false;
          p.connected = true;
          return new Map(map.set(p.id, p));
        }
        return map;
      });

      // Wait a moment before retrieving services
      await new Promise((r) => setTimeout(r, 900));

      const peripheralData = await BleManager.retrieveServices(peripheral.id);
      if (peripheralData.characteristics) {
        const peripheralParameters: PeripheralServices = {
          peripheralId: peripheral.id,
          serviceId: DEVICE_SERVICE_UUID,
          transfer: TRANSFER_CHARACTERISTIC_UUID,
          receive: RECEIVE_CHARACTERISTIC_UUID,
          characteristics: peripheralData.characteristics.map((c) => ({
            characteristic: c.characteristic,
            service: c.service,
            properties: c.properties,
          })),
        };
        setBleService(peripheralParameters);
        setIsConnected(true);
      }

      // Read initial RSSI
      const rssi = await BleManager.readRSSI(peripheral.id);
      setPeripherals((map) => {
        const p = map.get(peripheral.id);
        if (p) {
          p.rssi = rssi;
          return new Map(map.set(p.id, p));
        }
        return map;
      });
    } catch (error) {
      console.error(`[connectPeripheral][${peripheral.id}] error:`, error);
    }
  };

  const disconnectPeripheral = async (peripheralId: string) => {
    try {
      await BleManager.disconnect(peripheralId);
      setBleService(undefined);
      setPeripherals(new Map());
      setIsConnected(false);
    } catch (error) {
      console.error(`[disconnectPeripheral][${peripheralId}] error:`, error);
    }
  };

  const enableBluetooth = async () => {
    try {
      await BleManager.enableBluetooth();
    } catch (error) {
      console.error("[enableBluetooth] error", error);
    }
  };

  const startScan = async (scanDuration: number = 5) => {
    const state = await BleManager.checkState();
    if (state === "off") {
      if (Platform.OS === "ios") {
        Alert.alert(
          "Enable Bluetooth",
          "Please enable Bluetooth in Settings to continue.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openURL("App-Prefs:Bluetooth") },
          ]
        );
      } else {
        enableBluetooth();
      }
    }

    if (!isScanning) {
      setPeripherals(new Map());
      setRSSITrackValues([]);
      try {
        setIsScanning(true);
        await BleManager.scan(SERVICE_UUIDS, scanDuration, ALLOW_DUPLICATES, {
          matchMode: BleScanMatchMode.Sticky,
          scanMode: BleScanMode.LowLatency,
          callbackType: BleScanCallbackType.AllMatches,
        });
      } catch (error) {
        console.error("[startScan] ble scan error", error);
        setIsScanning(false);
      }
    }
  };

  const write = async () => {
    const MTU = 255;
    if (bleService) {
      const data = Array.from(new TextEncoder().encode("Hello World"));
      await BleManager.write(
        bleService.peripheralId,
        bleService.serviceId,
        bleService.transfer,
        data,
        MTU
      );
    }
  };

  const read = async () => {
    if (bleService) {
      const response = await BleManager.read(
        bleService.serviceId,
        bleService.peripheralId,
        bleService.receive
      );
      return response;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Bluetooth RSSI measure and connection</Text>
      {!isConnected ? (
        <DisconnectedState
          peripherals={Array.from(peripherals.values())}
          RSSITrackValues={RSSITrackValues}
          isScanning={isScanning}
          onScanPress={startScan}
          onConnect={connectPeripheral}
          localTrackerID={localTrackerID}
          setlocalTrackerID={setlocalTrackerID}
        />
      ) : (
        bleService && (
          <ConnectedState
            onRead={read}
            onWrite={write}
            bleService={bleService}
            onDisconnect={disconnectPeripheral}
          />
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingVertical: "10%",
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
});

export default BluetoothDemoScreen;
