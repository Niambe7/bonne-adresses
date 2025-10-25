// app/profile.tsx
import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { auth } from "../firebaseConfig";
import { signOut } from "firebase/auth";
import { useRouter } from "expo-router";

export default function Profile() {
  const router = useRouter();

  const logout = async () => {
    await signOut(auth);
    router.replace("/");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.email}>{auth.currentUser?.email}</Text>
      <Button title="Se déconnecter" onPress={logout} color="red" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  email: { fontSize: 18, marginBottom: 20 },
});
