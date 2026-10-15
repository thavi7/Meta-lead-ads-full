import { useEffect, useState } from "react";
import {View,Text,ScrollView,StyleSheet,ActivityIndicator,StatusBar,Platform,
} from "react-native";
import { io } from "socket.io-client";
import LeadCard from "../components/LeadCard";

const API_URL = "http://localhost:8080";

export default function HomeScreen() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const socket = io(API_URL);
    socket.on("lead:new", (lead) => {
      if (!active) return;
      setLeads((current) =>
        current.some((item) => item.id === lead.id) ? current: [lead, ...current]
      );
    });

    async function loadLeads() {
      try {
        const response = await fetch(`${API_URL}/leads`);
        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }
        const data = await response.json();
        if (!Array.isArray(data.leads)) {
          throw new Error("Invalid response from server");
        }
        if (active) {
          setLeads((current) => {
            const merged = new Map();
            data.leads.forEach((lead) => {
              merged.set(String(lead.id), lead);
            });
            current.forEach((lead) => {
              merged.set(String(lead.id), lead);
            });
            return Array.from(merged.values()).sort(
              (a, b) =>new Date(b.createdTime || 0) -new Date(a.createdTime || 0)
            );
          });

          setError("");
        }
      } catch (err) {
        if (active) {
          setError("Couldn't load leads. Check your connection.");
          console.error("Failed to load leads:", err);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadLeads();

    return () => {
      active = false;
      socket.disconnect();
    };
  }, []);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F5F0E8" />

      <View style={styles.header}>
        <Text style={styles.title}>Leads</Text>
        <Text style={styles.count}>
          {leads.length === 1 ? "1 received" : `${leads.length} received`}
        </Text>
      </View>

      <View style={styles.rule} />

      {loading ? (
        <View style={styles.state}>
          <ActivityIndicator color="#8A6A50" />
          <Text style={styles.stateText}>Loading leads</Text>
        </View>
      ) : error && leads.length === 0 ? (
        <View style={styles.state}>
          <Text style={styles.stateTitle}>Can't reach the server</Text>
          <Text style={styles.stateText}>{error}</Text>
        </View>
      ) : leads.length === 0 ? (
        <View style={styles.state}>
          <Text style={styles.stateTitle}>No leads yet</Text>
          <Text style={styles.stateText}>
            New submissions will show up here as they come in.
          </Text>
        </View>
      ) : (
        leads.map((lead) => <LeadCard key={String(lead.id)} lead={lead} />)
      )}
    </ScrollView>
  );
}

const serif = Platform.select({ ios: "Georgia", default: "serif" });

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5F0E8",
  },
  content: {
    paddingTop: 72,
    paddingBottom: 48,
    paddingHorizontal: 28,
  },
  header: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingBottom: 18,
  },
  title: {
    fontFamily: serif,
    fontSize: 38,
    color: "#2E241D",
    letterSpacing: -0.5,
  },
  count: {
    fontSize: 14,
    color: "#8C7B6A",
  },
  rule: {
    height: 1.5,
    backgroundColor: "#2E241D",
    marginBottom: 4,
  },
  state: {
    paddingVertical: 64,
    alignItems: "center",
    gap: 8,
  },
  stateTitle: {
    fontFamily: serif,
    fontSize: 20,
    color: "#2E241D",
  },
  stateText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#8C7B6A",
    textAlign: "center",
    maxWidth: 260,
  },
});