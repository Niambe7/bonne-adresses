// app/(tabs)/public-addresses.tsx
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, Button, ActivityIndicator } from "react-native";
import { collection, getDocs, query, where, getDoc, doc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useRouter } from "expo-router";

export default function PublicAddresses() {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [avatars, setAvatars] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      try {
        const q = query(collection(db, "addresses"), where("isPublic", "==", true));
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAddresses(data);
        try {
          const emails = Array.from(new Set(data.map((d: any) => String(d.user || '').toLowerCase()).filter(Boolean)));
          const entries = await Promise.all(
            emails.map(async (e) => {
              try {
                const s = await getDoc(doc(db, "users", e));
                return [e, s.exists() ? (s.data() as any).avatarUrl || '' : ''];
              } catch {
                return [e, ''];
              } 
            })
          );
          const map: Record<string, string> = Object.fromEntries(entries);
          setAvatars(map);
        } catch {}
      } catch (e) {
        console.error("Erreur chargement publiques:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const openOnMap = (item: any) => {
    router.push({
      pathname: "/(tabs)/map",
      params: {
        latitude: String(item.latitude),
        longitude: String(item.longitude),
        name: item.name,
      },
    });
  };

  const openComments = (id: string, compose?: boolean) => {
    router.push({ pathname: "/comments/[id]", params: { id, compose: compose ? "1" : "0" } });
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={addresses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.image} />
            ) : null}
            <View style={styles.headerRow}><Image source={{ uri: (avatars[String(item.user || "").toLowerCase()] || undefined) }} style={styles.avatar} /><Text style={styles.title}>{item.name}</Text></View>
            {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}

            <View style={styles.actions}>
              <TouchableOpacity style={[styles.btn, styles.primary]} onPress={() => openOnMap(item)}>
                <Text style={styles.btnText}>Ouvrir sur la carte</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.secondary]} onPress={() => openComments(item.id)}>
                <Text style={styles.btnText}>Voir commentaires</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.accent]} onPress={() => openComments(item.id, true)}>
                <Text style={styles.btnText}>Donner un avis</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 15 },
  card: {
    backgroundColor: "#fff",
    marginBottom: 16,
    padding: 14,
    borderRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#eee",
  },
  image: { width: "100%", height: 160, borderRadius: 8, marginBottom: 10 },
  title: { fontSize: 18, fontWeight: "bold" },
  desc: { color: "#444", marginBottom: 10 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  avatar: { width: 28, height: 28, borderRadius: 14, marginRight: 8, backgroundColor: "#ddd" },
  actions: { flexDirection: "row", gap: 8, flexWrap: "wrap" as const },
  btn: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 6 },
  primary: { backgroundColor: "#007bff" },
  secondary: { backgroundColor: "#6c757d" },
  accent: { backgroundColor: "#28a745" },
  btnText: { color: "#fff", fontWeight: "600" },
});








