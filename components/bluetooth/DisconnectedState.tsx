import { StyleSheet, Text, TouchableOpacity, View, TextInput, Platform, PermissionsAndroid } from "react-native";
import React from "react";
import RNFS from "react-native-fs";
import { StrippedPeripheral } from "@/types/bluetooth";
import PeripheralList from "../PeripheralList";

interface DisconnectedStateProps {
  peripherals: StrippedPeripheral[];
  isScanning: boolean;
  onScanPress: (duration: number) => void;
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
  const [minRSSIInput, setMinRSSIInput] = React.useState("");
  const [RSSITrackValues, setRSSITrackValues] = React.useState<number[]>([]);
  const [scanDurationInput, setScanDurationInput] = React.useState("10");
  const [fileName, setFileName] = React.useState("rssi_values"); // default file name

  const minRSSI = minRSSIInput.trim() === "" ? -999 : -Number(minRSSIInput);
  const scanDuration = scanDurationInput.trim() === "" ? 10 : Number(scanDurationInput);

  // Track RSSI values for selected tracker
  React.useEffect(() => {
    if (!localTrackerID) return;

    const match = peripherals.find((p) => p.id === localTrackerID);
    if (match) {
      setRSSITrackValues((prev) => [...prev, match.rssi]);
      console.log("RSSI values:", [...RSSITrackValues, match.rssi]);
    }
  }, [peripherals, localTrackerID]);

  // Helper function for readable timestamp
  const getReadableTimestamp = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
  };

  // Export RSSI to Downloads (Android) or Documents (iOS) with readable timestamp
  const exportRSSIToFile = async () => {
    if (RSSITrackValues.length === 0) {
      alert("No RSSI data to export!");
      return;
    }

    if (!fileName.trim()) {
      alert("Please enter a valid file name!");
      return;
    }

    try {
      const timestamp = getReadableTimestamp();
      const finalFileName = `${fileName.trim()}_${timestamp}.txt`;

      let filePath = "";

      if (Platform.OS === "android") {
        if (Platform.Version < 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
              title: "Storage Permission",
              message: "App needs access to save RSSI values to Downloads",
              buttonPositive: "OK",
            }
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            alert("Permission denied to save file");
            return;
          }
        }

        filePath = `${RNFS.DownloadDirectoryPath}/${finalFileName}`;
      } else {
        filePath = `${RNFS.DocumentDirectoryPath}/${finalFileName}`;
      }

      const data = RSSITrackValues.join("\n");
      await RNFS.writeFile(filePath, data, "utf8");
      alert(`RSSI values saved to: ${filePath}`);
      console.log("File saved at:", filePath);

    } catch (error) {
      console.error("Error saving file:", error);
      alert("Failed to save RSSI values");
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => {
          setRSSITrackValues([]); // reset array
          onScanPress(scanDuration); // start scan
        }}
      >
        <Text style={styles.scanButtonText}>
          {isScanning ? "Scanning..." : "Start Scan"}
        </Text>
      </TouchableOpacity>

      {/* Custom file name input */}
      <TextInput
        style={[styles.input2, { marginBottom: 8 }]}
        placeholder="Enter file name"
        value={fileName}
        onChangeText={setFileName}
      />

      <TouchableOpacity
        style={[styles.scanButton, { backgroundColor: "#34C759" }]}
        onPress={exportRSSIToFile}
      >
        <Text style={styles.scanButtonText}>Export RSSI to TXT</Text>
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
          value={localTrackerID}
          onChangeText={setLocalTrackerID}
        />
      </View>

      {peripherals.length > 0 ? (
        <PeripheralList
          localNameFilter={localNameFilter}
          minRSSI={minRSSI}
          onConnect={onConnect}
          peripherals={peripherals}
        />
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
  input2: {
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
});
