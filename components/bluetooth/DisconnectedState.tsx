import { StyleSheet, Text, TouchableOpacity,View , TextInput} from "react-native";
import React from "react";
import { StrippedPeripheral } from "@/types/bluetooth";
import PeripheralList from "../PeripheralList";

interface DisconnectedStateProps {
  peripherals: StrippedPeripheral[];
  isScanning: boolean;
  onScanPress: (duration: number) => void; // <- updated

  onConnect: (peripheral: StrippedPeripheral) => Promise<void>;
}

const DisconnectedState: React.FunctionComponent<DisconnectedStateProps> = ({
  isScanning,
  onScanPress,
  peripherals,
  onConnect,
}) => {

const [localNameFilter, setLocalNameFilter] = React.useState("");
const [localTrackerID, setLocalTrackerID] = React.useState("E4:17:D8:88:30:C1");
const [minRSSIInput, setMinRSSIInput] = React.useState(""); // string from TextInput
const [RSSITrackValues, setRSSITrackValues] = React.useState<number[]>([]);
// Convert to number for filter
const minRSSI = minRSSIInput.trim() === "" ? -999 : -Number(minRSSIInput);

const [scanDurationInput, setScanDurationInput] = React.useState(""); // string from TextInput
const scanDuration = scanDurationInput.trim() === "" ? 5 : Number(scanDurationInput);

React.useEffect(() => {
  if (!localTrackerID) return;

  const match = peripherals.find((p) => p.id === localTrackerID);

  if (match) {
    setRSSITrackValues((prev) => [...prev, match.rssi]);
    console.log(RSSITrackValues)
  }
}, [peripherals, localTrackerID]);

  return (
    <>
     <TouchableOpacity
  style={styles.scanButton}
  onPress={() => {
  setRSSITrackValues([]);        // reset array
  onScanPress(scanDuration);     // start scan
}}
>
  <Text style={styles.scanButtonText}>
    {isScanning ? "Scanning..." : "Start Scan"}
  </Text>
</TouchableOpacity>

        {/* Filters */}
      <View style={styles.filtersContainer}>
  <TextInput
    style={styles.input}
    placeholder="Filter by Local Name"
    value={localNameFilter}
    onChangeText={setLocalNameFilter}
  />
  <TextInput
    style={styles.input}
    placeholder="Minimum RSSI"
    keyboardType="numeric"
    value={minRSSIInput}
    onChangeText={setMinRSSIInput}
  />
  <TextInput
    style={styles.input}
    placeholder="Scan Duration (sec)"
    keyboardType="numeric"
    value={scanDurationInput}
    onChangeText={setScanDurationInput}
  />
    <TextInput
    style={styles.input}
    placeholder="Tracker ID"
    keyboardType="numeric"
    value={localTrackerID}
    onChangeText={setLocalTrackerID}
  />
</View>

      {peripherals.length > 0 ? (
        <PeripheralList   localNameFilter={localNameFilter}
  minRSSI={minRSSI} onConnect={onConnect} peripherals={peripherals} />
      ) : (
        <Text style={styles.emptyText}>No peripherals found</Text>
      )}
    </>
  );
};

export default DisconnectedState;

const styles = StyleSheet.create({
  scanButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  scanButtonText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "500",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginTop: 20,
  },
  filtersContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
  },
});