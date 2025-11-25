import React from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";

interface ManufacturerData {
  bytes: number[];
  data: string;
  CDVType: string;
}
interface Advertising {
  manufacturerData?: { [key: string]: ManufacturerData };
  serviceData?: Record<string, any>;
  isConnectable?: boolean;
  serviceUUIDs?: string[];
  manufacturerRawData?: ManufacturerData;
  rawData?: ManufacturerData;
  txPowerLevel?: number;
}
interface Peripheral {
  name?: string;
  localName?: string;
  rssi: number;
  id: string;
  isConnectable:string;
  advertising:Advertising;
}


interface PeripheralListProps {
  peripherals: Peripheral[];
  onConnect: (peripheral: Peripheral) => Promise<void>;
  minRSSI: number,
  localNameFilter: string,
}

const PeripheralList: React.FC<PeripheralListProps> = ({
  peripherals,
  onConnect,
  minRSSI,
  localNameFilter,
}) => {

const filteredPeripherals = peripherals.filter((p) => {
  const matchesRSSI = p.rssi >= minRSSI;

  const matchesName =
    localNameFilter.trim() === "" ||
    [p.name, p.localName]
      .filter(Boolean) // remove undefined/null
      .some((n) =>
        n!.toLowerCase().includes(localNameFilter.toLowerCase())
      );

  return matchesRSSI && matchesName;
});




  return (
    <View style={styles.container}>
      <FlatList
         data={filteredPeripherals
    .filter(p => /* optional other filters, e.g., name */ true)
    .sort((a, b) => b.rssi - a.rssi) // sort descending by RSSI (largest first)
  }
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => onConnect(item)} style={styles.card}>
            <Text style={styles.title}>{item.name || "Unknown Device"}</Text>
            <Text style={styles.subtitle}>
              Local Name: {item.localName || "N/A"}
            </Text>
            <Text style={styles.info}>RSSI: {item.rssi} dBm</Text>
            <Text style={styles.info}>ID: {item.id}</Text>
            <Text style={styles.info}> Connectable: {item.advertising?.isConnectable !== undefined 
            ? item.advertising.isConnectable ? "Yes" : "No" 
            : "Unknown"}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    marginVertical: 8,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
  },
  info: {
    fontSize: 14,
    color: "#333",
  },
});

export default PeripheralList;
