import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import React from "react";
import { PeripheralServices } from "@/types/bluetooth";

interface ConnectedStateProps {
  bleService: PeripheralServices;
  onRead: () => void;
  onWrite: () => void;
  onDisconnect: (id: string) => void;
}

const ConnectedState: React.FunctionComponent<ConnectedStateProps> = ({
  bleService,
  onDisconnect,
  onRead,
  onWrite,
}) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
      {/* Peripheral Info */}
      <View style={styles.card}>
        <Text style={styles.info}>Peripheral ID: {bleService.peripheralId}</Text>
        <Text style={styles.info}>Service ID: {bleService.serviceId}</Text>
      </View>

      {/* Characteristics Info */}
      {bleService.characteristics && (
        <View style={styles.card}>
          <Text style={[styles.info, { fontWeight: "bold", marginBottom: 8 }]}>
            Characteristics:
          </Text>
          {bleService.characteristics.map((c, index) => (
            <View key={index} style={{ marginBottom: 8 }}>
              <Text style={styles.info}>Characteristic: {c.characteristic}</Text>
              <Text style={styles.info}>Service: {c.service}</Text>
              <Text style={styles.info}>
                Properties: {Object.keys(c.properties).join(", ")}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity onPress={onRead} style={styles.button}>
          <Text style={styles.buttonText}>READ</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onWrite} style={styles.button}>
          <Text style={styles.buttonText}>WRITE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onDisconnect(bleService.peripheralId)}
          style={styles.disconnectButton}
        >
          <Text style={styles.buttonText}>DISCONNECT</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default ConnectedState;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  actionButtons: {
    flexDirection: "row",
    marginTop: 16,
    justifyContent: "space-between",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
    flex: 1,
  },
  disconnectButton: {
    backgroundColor: "red",
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
    flex: 1,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "500",
  },
  info: {
    fontSize: 14,
    color: "#333",
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
});
