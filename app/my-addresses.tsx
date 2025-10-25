// app/my-addresses.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { useRouter } from "expo-router";

export default function MyAddresses() {
  const [addresses, setAddresses] = useState<any[]>([]);
  const router = useRouter();

  // 🔹 Charger les adresses de l'utilisateur connecté
  useEffect(() => {
    const load = async () => {
      try {
        const q = query(
          collection(db, "addresses"),
          where("user", "==", auth.currentUser?.email)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setAddresses(data);
      } catch (error) {
        console.error("Erreur lors du chargement :", error);
      }
    };

    load();
  }, []);

  // 🔹 Supprimer une adresse
  const handleDelete = async (id: string) => {
    Alert.alert(
      "Supprimer l’adresse",
      "Es-tu sûr de vouloir supprimer cette adresse ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "addresses", id));
              setAddresses((prev) => prev.filter((item) => item.id !== id));
              Alert.alert("Supprimée ✅", "L’adresse a bien été supprimée.");
            } catch (error) {
              console.error("Erreur de suppression :", error);
              Alert.alert("Erreur", "Impossible de supprimer cette adresse.");
            }
          },
        },
      ]
    );
  };

  // 🔹 Ouvrir la carte sur une adresse précise
  const goToMap = (latitude: number, longitude: number, name: string) => {
    router.push({
      pathname: "/map",
      params: { latitude: latitude.toString(), longitude: longitude.toString(), name },
    });
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={addresses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 50 }} // ✅ marge haut + bas
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              goToMap(item.latitude, item.longitude, item.name)
            } // ✅ clic = ouvre la carte centrée
          >
            <View style={styles.card}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.image} />
              ) : null}

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={styles.title}>{item.name}</Text>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                  <Text style={styles.deleteButton}>Supprimer</Text>
                </TouchableOpacity>
              </View>

              <Text>{item.description}</Text>
              <Text style={{ fontStyle: "italic" }}>
                {item.isPublic ? "🌍 Publique" : "🔒 Privée"}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 15 },
  card: {
    backgroundColor: "#fff",
    marginBottom: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  image: { width: "100%", height: 150, borderRadius: 8, marginBottom: 10 },
  title: { fontSize: 18, fontWeight: "bold" },
  deleteButton: { color: "red", fontWeight: "bold" },
});
