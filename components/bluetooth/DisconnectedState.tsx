import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, TextInput, Platform, PermissionsAndroid } from "react-native";
import RNFS from "react-native-fs";
import { StrippedPeripheral } from "@/types/bluetooth";
import PeripheralList from "../PeripheralList";

interface DisconnectedStateProps {
  peripherals: StrippedPeripheral[];
  RSSITrackValues: number[];
  isScanning: boolean;
  onScanPress: (duration?: number) => void;
  onConnect: (peripheral: StrippedPeripheral) => Promise<void>;
  localTrackerID: string;
  setlocalTrackerID: (id: string) => void;
}

const DisconnectedState: React.FC<DisconnectedStateProps> = ({
  peripherals,
  RSSITrackValues,
  isScanning,
  onScanPress,
  onConnect,
  localTrackerID,
  setlocalTrackerID,
}) => {
  const [fileName, setFileName] = useState("rssi_values");
  const [localNameFilter, setLocalNameFilter] = useState("");
  const [minRSSIInput, setMinRSSIInput] = useState("");
  const [scanDurationInput, setScanDurationInput] = useState("10");

  const minRSSI = minRSSIInput.trim() === "" ? -999 : Number(minRSSIInput);
  const scanDuration = scanDurationInput.trim() === "" ? 10 : Number(scanDurationInput);

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
      const timestamp = new Date().toISOString().replace(/:/g, "-");
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
    } catch (error) {
      console.error("Error saving file:", error);
      alert("Failed to save RSSI values");
    }
  };

  return (
    <>
      {/* Scan Button */}
      <TouchableOpacity
        style={[styles.scanButton, { backgroundColor: isScanning ? "red" : "#007AFF" }]}
        onPress={() => onScanPress(scanDuration)}
      >
        <Text style={styles.scanButtonText}>{isScanning ? "Scanning..." : "Start Scan"}</Text>
      </TouchableOpacity>

      {/* File Name Input */}
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
          onChangeText={setlocalTrackerID}

          // editable={false} // optional: you may make it editable if needed
        />
      </View>

      {/* Peripheral List */}
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

      {/* RSSI Values
      <View style={{ marginTop: 16 }}>
        <Text>RSSI Track Values (duplicates allowed):</Text>
        <Text>{RSSITrackValues.join(", ")}</Text>
      </View> */}
    </>
  );
};

export default DisconnectedState;

const styles = StyleSheet.create({
  scanButton: {
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
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginTop: 20,
  },
});
