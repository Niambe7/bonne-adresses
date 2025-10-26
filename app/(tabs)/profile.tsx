// app/(tabs)/profile.tsx
import React from "react";
import { View, Text, Button, Alert, StyleSheet } from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import { useRouter } from "expo-router";

export default function ProfileScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      Alert.alert("Déconnexion réussie", "À bientôt !");
      router.replace("/"); // ✅ redirige vers la page index
    } catch (error) {
      console.error(error);
      Alert.alert("Erreur", "Impossible de se déconnecter.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profil</Text>
      <Text style={styles.subtitle}>
        Connecté en tant que {auth.currentUser?.email}
      </Text>
      <Button title="Se déconnecter" onPress={handleLogout} color="#d9534f" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white", // ✅ fond clair
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    marginBottom: 20,
  },
});
