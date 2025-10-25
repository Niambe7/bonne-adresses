// app/map.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
  Image,
} from "react-native";
import MapView, { Marker, MapPressEvent } from "react-native-maps";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { signOut } from "firebase/auth";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../firebaseConfig";
import { useRouter } from "expo-router";
import { useLocalSearchParams } from "expo-router";


export default function MapScreen() {
  const [region, setRegion] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCoord, setSelectedCoord] = useState<any>(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams();


  // 🔹 Récupère la position actuelle et charge les adresses
useEffect(() => {
  (async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission refusée", "L’accès à la localisation est nécessaire.");
      return;
    }

    // ✅ Si on vient depuis "Mes adresses"
    if (params.latitude && params.longitude) {
      setRegion({
        latitude: parseFloat(params.latitude as string),
        longitude: parseFloat(params.longitude as string),
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } else {
      // ✅ Sinon on prend la position actuelle
      const location = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  })();

  loadAddresses();
}, [params]);



  // 🔹 Récupère toutes les adresses depuis Firestore
  const loadAddresses = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "addresses"));
      const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMarkers(data);
    } catch (error) {
      console.error("Erreur lors du chargement :", error);
    }
  };

  // 🔹 Quand on appuie sur la carte → prépare à ajouter une adresse
  const handleAddMarker = (e: MapPressEvent) => {
    setSelectedCoord(e.nativeEvent.coordinate);
    setModalVisible(true);
  };

  // 🔹 Sélectionne une image locale depuis la galerie
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // 🔹 Sauvegarde une adresse dans Firestore + upload image dans Storage
  const saveAddress = async () => {
    if (!name.trim()) {
      Alert.alert("Erreur", "Veuillez entrer un nom d’adresse.");
      return;
    }

    let imageUrl = "";

    try {
      // Upload de la photo (si sélectionnée)
      if (image) {
        const response = await fetch(image);
        const blob = await response.blob();
        const filename = `images/${Date.now()}_${auth.currentUser?.uid}.jpg`;
        const storageRef = ref(storage, filename);
        await uploadBytes(storageRef, blob);
        imageUrl = await getDownloadURL(storageRef);
      }

      // Enregistrement Firestore
      await addDoc(collection(db, "addresses"), {
        name,
        description: desc,
        latitude: selectedCoord.latitude,
        longitude: selectedCoord.longitude,
        imageUrl,
        user: auth.currentUser?.email || "inconnu",
        isPublic,
      });

      Alert.alert("Succès", "Adresse ajoutée !");
      setModalVisible(false);
      setName("");
      setDesc("");
      setImage(null);
      setIsPublic(false);
      loadAddresses();
    } catch (error) {
      console.error("Erreur lors de l’ajout :", error);
      Alert.alert("Erreur", "Impossible d’ajouter l’adresse.");
    }
  };

  // 🔹 Déconnexion
  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (!region)
    return (
      <Text style={{ textAlign: "center", marginTop: 50 }}>Chargement de la carte...</Text>
    );

  return (
    <View style={styles.container}>
      {/* 🌍 Carte Google Maps */}
      <MapView style={styles.map} region={region} onPress={handleAddMarker}>
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
            title={marker.name}
            description={marker.description}
          />
        ))}
      </MapView>

      {/* 🔴 Bouton Déconnexion */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Déconnexion</Text>
      </TouchableOpacity>

      {/* 🏠 Modale d’ajout d’adresse */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Nouvelle adresse</Text>

            <TextInput
              placeholder="Nom de l’adresse"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />

            <TextInput
              placeholder="Description"
              value={desc}
              onChangeText={setDesc}
              style={styles.input}
            />

            {/* 🌍 Switch Public/Privé */}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <Text>Adresse publique ? </Text>
              <Switch value={isPublic} onValueChange={setIsPublic} />
            </View>

            {/* 📸 Sélection d’image */}
            <Button title="Choisir une photo" onPress={pickImage} />
            {image && (
              <View style={{ alignItems: "center", marginVertical: 8 }}>
                <Image source={{ uri: image }} style={styles.preview} />
                <Text>📸 Image sélectionnée</Text>
              </View>
            )}

            {/* ✅ Enregistrer ou annuler */}
            <Button title="Enregistrer" onPress={saveAddress} />
            <Button title="Annuler" onPress={() => setModalVisible(false)} color="red" />
          </View>
        </View>
      </Modal>
    </View>
  );
}

// 💅 Styles
const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  logoutBtn: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "#ff5757",
    padding: 10,
    borderRadius: 8,
  },
  logoutText: { color: "white", fontWeight: "bold" },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
  },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 15, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  preview: { width: 120, height: 120, borderRadius: 10, marginTop: 10 },
});
