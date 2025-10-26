// app/register.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useRouter } from "expo-router";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const router = useRouter();

  const handleRegister = async () => {
    if (password !== confirm) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      Alert.alert("Succès", "Compte créé avec succès !");
      router.replace("/"); // redirige vers connexion
    } catch (error: any) {
      console.error(error);
      Alert.alert("Erreur", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Créer un compte</Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Mot de passe"
        placeholderTextColor="#999"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry
      />
      <TextInput
        placeholder="Confirmer le mot de passe"
        placeholderTextColor="#999"
        value={confirm}
        onChangeText={setConfirm}
        style={styles.input}
        secureTextEntry
      />

      <Button title="S'inscrire" onPress={handleRegister} color="#007bff" />

      <TouchableOpacity onPress={() => router.push("/")}>
        <Text style={styles.link}>Déjà un compte ? Se connecter</Text>
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    color: "black", // ✅ texte noir
  },
  link: {
    color: "#007bff",
    textAlign: "center",
    marginTop: 10,
  },
});