// app/comments/[id].tsx
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db, auth, storage } from "../../firebaseConfig";
import * as ImagePicker from "expo-image-picker";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function CommentsScreen() {
  const { id, compose } = useLocalSearchParams<{ id: string; compose?: string }>();
  const router = useRouter();
  const [comments, setComments] = useState<any[]>([]);
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [text, setText] = useState("");
  const [rating, setRating] = useState<string>("");
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    if (compose === "1") setModal(true);
  }, [compose]);

  const load = async () => {
    try {
      const snap = await getDocs(collection(db, `addresses/${id}/comments`));
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setComments(data);
    } catch (e) {
      console.error("Erreur commentaires:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.7 });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const save = async () => {
    if (!text.trim()) {
      Alert.alert("Avis", "Merci d'ajouter un commentaire.");
      return;
    }
    let imageUrl = "";
    try {
      if (image) {
        const response = await fetch(image);
        const blob = await response.blob();
        const filename = `comments/${id}/${Date.now()}_${auth.currentUser?.uid}.jpg`;
        const storageRef = ref(storage, filename);
        await uploadBytes(storageRef, blob);
        imageUrl = await getDownloadURL(storageRef);
      }
      const r = parseInt(rating || "0", 10);
      await addDoc(collection(db, `addresses/${id}/comments`), {
        text,
        rating: isNaN(r) ? 0 : r,
        imageUrl,
        user: (auth.currentUser?.email || "inconnu").toLowerCase(),
        createdAt: new Date(),
      });
      setModal(false);
      setText("");
      setRating("");
      setImage(null);
      load();
      Alert.alert("Merci !", "Votre avis a �t� ajout�.");
    } catch (e) {
      console.error("Erreur ajout avis:", e);
      Alert.alert("Erreur", "Impossible d'ajouter l'avis.");
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>  Retour</Text></TouchableOpacity>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModal(true)}><Text style={styles.addText}>Donner un avis</Text></TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 40, paddingHorizontal: 15 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: 'bold' }}>{item.user}</Text>
                {item.rating ? <Text>Note: {item.rating}/5</Text> : null}
              </View>
              {item.text ? <Text style={{ marginVertical: 6 }}>{item.text}</Text> : null}
              {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.image} /> : null}
            </View>
          )}
        />
      )}

      <Modal visible={modal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Donner un avis</Text>
            <TextInput
              placeholder="Votre commentaire"
              placeholderTextColor="#999"
              value={text}
              onChangeText={setText}
              style={styles.input}
            />
            <TextInput
              placeholder="Note (0-5)"
              placeholderTextColor="#999"
              value={rating}
              onChangeText={setRating}
              keyboardType="numeric"
              style={styles.input}
            />
            <TouchableOpacity onPress={pickImage} style={[styles.btn, { backgroundColor: '#6c757d' }]}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>{image ? 'Changer la photo' : 'Ajouter une photo'}</Text>
            </TouchableOpacity>
            <View style={{ height: 8 }} />
            <TouchableOpacity onPress={save} style={[styles.btn, { backgroundColor: '#28a745' }]}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>Enregistrer</Text>
            </TouchableOpacity>
            <View style={{ height: 6 }} />
            <TouchableOpacity onPress={() => setModal(false)} style={[styles.btn, { backgroundColor: 'red' }]}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
  back: { color: '#007bff', fontWeight: '600' },
  addBtn: { backgroundColor: '#007bff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  addText: { color: '#fff', fontWeight: '600' },
  card: { backgroundColor: '#fff', marginBottom: 12, padding: 14, borderRadius: 10, elevation: 1, borderWidth: 1, borderColor: '#eee' },
  image: { width: '100%', height: 160, borderRadius: 8, marginTop: 8 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: { width: '85%', backgroundColor: 'white', padding: 20, borderRadius: 10 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 10, color: 'black' },
  btn: { alignItems: 'center', paddingVertical: 10, borderRadius: 8 },
});
