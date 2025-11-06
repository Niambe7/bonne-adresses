// app/(tabs)/private-addresses.tsx
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { collection, getDocs, query, where, deleteDoc, doc, getDoc } from "firebase/firestore";
import { auth, db, storage } from "../../firebaseConfig";
import { ref, deleteObject } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "expo-router";

export default function PrivateAddresses() {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);
  const [usedEmail, setUsedEmail] = useState<string | null>(null);
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      try {
        setLastError(null);
        if (!u?.email) {
          console.log('[private] no user, skip');
          setAddresses([]);
          setUsedEmail(null);
          setLoading(false);
          return;
        }
        setLoading(true);
        const email = String(u.email).trim().toLowerCase();
        setUsedEmail(email);
        console.log('[private] querying for user =', email);
        let snap;
        try {
          const q1 = query(
            collection(db, "addresses"),
            where("user", "==", email),
            where("isPublic", "==", false)
          );
          snap = await getDocs(q1);
        } catch (err: any) {
          console.warn('[private] strict query failed, fallback to user-only:', err?.code || String(err));
          const q2 = query(collection(db, "addresses"), where("user", "==", email));
          snap = await getDocs(q2);
        }
        console.log('[private] raw hit count =', snap.size);
        const all = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        all.forEach((it: any) => console.log('[private] doc', it.id, { user: it.user, isPublic: it.isPublic }));
        const data = all.filter((x: any) => x && x.isPublic === false);
        console.log('[private] filtered private count =', data.length);
        setAddresses(data);
      } catch (e: any) {
        console.error('Erreur chargement privées:', e);
        setLastError(String(e?.message || e));
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  const openOnMap = (item: any) => {
    router.push({
      pathname: "/(tabs)/map",
      params: {
        latitude: String(item.latitude),
        longitude: String(item.longitude),
        name: item.name,
        imageUrl: item.imageUrl || "",
        description: item.description || "",
      },
    });
  };

  const confirmDelete = (item: any) => {
    Alert.alert(
      "Supprimer l'adresse",
      `Voulez-vous vraiment supprimer "${item.name || "cette adresse"}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        { text: "Supprimer", style: "destructive", onPress: () => deleteAddress(item) },
      ]
    );
  };

  const deleteAddress = async (item: any) => {
    try {
      setDeletingId(item.id);
      // Tenter de supprimer l'image associée si présente (via URL de téléchargement)
      if (item.imageUrl) {
        try {
          // Le SDK web autorise ref(storage, fullDownloadUrl)
          const imageRef = ref(storage, String(item.imageUrl));
          await deleteObject(imageRef);
        } catch (e) {
          console.warn('delete image warn:', e);
        }
      }
      const dref = doc(db, "addresses", String(item.id));
      await deleteDoc(dref);
      setAddresses((prev) => prev.filter((a) => a.id !== item.id));
    } catch (e: any) {
      console.error('delete address error:', e);
      const email = auth.currentUser?.email || 'unknown';
      Alert.alert(
        'Erreur',
        `Impossible de supprimer l'adresse.\n${String(e?.message || e)}\nUtilisateur: ${email}`
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;

  return (
    <View style={styles.container}>
      {lastError ? (
        <Text style={{ color: '#b00020', marginTop: 8 }}>
          Erreur: {lastError}{usedEmail ? ` (email=${usedEmail})` : ''}
        </Text>
      ) : null}
      <FlatList
        data={addresses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
        ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#666' }}>Aucune adresse privée.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.image} />
            ) : null}
            <Text style={styles.title}>{item.name}</Text>
            {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}

            <View style={styles.actions}>
              <TouchableOpacity style={[styles.btn, styles.primary]} onPress={() => openOnMap(item)}>
                <Text style={styles.btnText}>Ouvrir sur la carte</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.danger]}
                onPress={() => confirmDelete(item)}
                disabled={deletingId === item.id}
              >
                <Text style={styles.btnText}>{deletingId === item.id ? 'Suppression...' : 'Supprimer'}</Text>
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
  actions: { flexDirection: "row", gap: 8, flexWrap: "wrap" as const },
  btn: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 6 },
  primary: { backgroundColor: "#007bff" },
  danger: { backgroundColor: "#d9534f" },
  btnText: { color: "#fff", fontWeight: "600" },
});
