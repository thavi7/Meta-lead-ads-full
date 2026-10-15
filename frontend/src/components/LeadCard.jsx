import { View, Text, StyleSheet, Platform } from "react-native";

export default function LeadCard({ lead }) {
  const initials = (lead.name || "New Lead")
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const formattedDate = lead.createdTime
    ? new Date(lead.createdTime).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Recently received";

  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {lead.name || "Unnamed lead"}
          </Text>
          <Text style={styles.date}>{formattedDate}</Text>
        </View>

        <Text style={lead.email ? styles.detail : styles.missing}>
          {lead.email || "No email"}
        </Text>
        <Text style={lead.phone ? styles.detail : styles.missing}>
          {lead.phone || "No phone"}
        </Text>

        <Text style={styles.leadId} numberOfLines={1}>
          {lead.id}
        </Text>
      </View>
    </View>
  );
}

const serif = Platform.select({ ios: "Georgia", default: "serif" });

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingVertical: 22,
    borderBottomWidth: 1,
    borderBottomColor: "#E3DACB",
    gap: 16,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#B9A58F",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  avatarText: {
    fontFamily: serif,
    fontSize: 15,
    color: "#6B4F3A",
  },
  body: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 6,
  },
  name: {
    flex: 1,
    fontFamily: serif,
    fontSize: 19,
    color: "#2E241D",
  },
  date: {
    fontSize: 12,
    color: "#9A8A78",
  },
  detail: {
    fontSize: 14,
    lineHeight: 21,
    color: "#4F4136",
  },
  missing: {
    fontSize: 14,
    lineHeight: 21,
    color: "#B5A796",
    fontStyle: "italic",
  },
  leadId: {
    fontSize: 11,
    color: "#B5A796",
    marginTop: 8,
  },
});