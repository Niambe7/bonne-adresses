// app/index.tsx
import React, { useState } from "react";
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import { useRouter } from "expo-router";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/(tabs)/map"); // ✅ redirige vers la carte
    } catch (error: any) {
      console.error(error);
      Alert.alert("Erreur", "Email ou mot de passe incorrect.");
    }
  };

  return (
    <View style={styles.container}>
    <TextInput
      placeholder="Email"
      placeholderTextColor="rgba(18, 17, 17, 1)" // 👈 gris clair visible en clair et sombre
      value={email}
      onChangeText={setEmail}
      style={styles.input}
      keyboardType="email-address"
    />

    <TextInput
      placeholder="Mot de passe"
      placeholderTextColor="rgba(6, 6, 6, 1)" // 👈 idem
      value={password}
      onChangeText={setPassword}
      style={styles.input}
      secureTextEntry
    />
      <Button title="Se connecter" onPress={handleLogin} color="#007bff" />
      <TouchableOpacity onPress={() => router.push("/register")}>
        <Text style={styles.link}>Pas de compte ? S'inscrire</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "white", // ✅ fond blanc
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  link: {
    color: "#007bff",
    textAlign: "center",
    marginTop: 10,
  },
});
