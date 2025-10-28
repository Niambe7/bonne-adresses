// app/(tabs)/profile.tsx
import React, { useEffect, useState } from "react";
import { View, Text, Button, Alert, StyleSheet, Image, TouchableOpacity } from "react-native";
import { signOut } from "firebase/auth";
import { auth, db, storage } from "../../firebaseConfig";
import { useRouter } from "expo-router";
import { doc, getDoc, setDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function ProfileScreen() {
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const email = auth.currentUser?.email?.toLowerCase();
      if (!email) return;
      try {
        const snap = await getDoc(doc(db, "users", email));
        if (snap.exists()) {
          const data: any = snap.data();
          if (data?.avatarUrl) setAvatarUrl(data.avatarUrl);
        }
      } catch (e) {
        console.error("Load profile error:", e);
      }
    };
    load();
  }, []);

  const pickAndSaveAvatar = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: true,
      });
      if (res.canceled) return;
      const uri = res.assets[0].uri;
      const email = auth.currentUser?.email?.toLowerCase();
      const uid = auth.currentUser?.uid;
      if (!email || !uid) return;
      setSaving(true);
      const blob = await (await fetch(uri)).blob();
      const filename = `profiles/${uid}_${Date.now()}.jpg`;
      const storageRef = ref(storage, filename);
      console.log('avatar: uploading to Storage at', filename);
      await uploadBytes(storageRef, blob);
      // upload done
      const url = await getDownloadURL(storageRef);
      console.log('avatar: storage upload OK, url =', url);
      console.log('avatar: writing Firestore users doc for', email);
      await setDoc(doc(db, "users", email), { avatarUrl: url, email }, { merge: true });
      console.log('avatar: firestore write OK');
      setAvatarUrl(url);
      Alert.alert("Profil", "Photo de profil mise � jour.");
    } catch (e) {
      console.error("Avatar save error:", e);
      Alert.alert("Erreur", "Impossible d'enregistrer la photo.");
    } finally {
      setSaving(false);
    }
  };

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
      <TouchableOpacity onPress={pickAndSaveAvatar} disabled={saving} style={styles.avatarWrap}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <Image source={require("../../assets/images/icon.png")} style={styles.avatar} />
        )}
      </TouchableOpacity>
      <View style={{ height: 10 }} />
      <Button title={saving ? "Enregistrement..." : "Changer la photo"} onPress={pickAndSaveAvatar} color="#007bff" />
      <Button title="Se déconnecter" onPress={handleLogout} color="#d9534f" />
    
      <View style={{ height: 12 }} />
      <Button title="Adresses publiques" onPress={() => router.push("/(tabs)/public-addresses")} color="#007bff" /></View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white", // ✅ fond clair
  },
  avatarWrap: { marginBottom: 10 },
  avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 2, borderColor: '#eee' },
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











