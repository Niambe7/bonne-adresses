// app/(tabs)/map.tsx
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
import MapView, { Marker, MapPressEvent, Callout } from "react-native-maps";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { signOut } from "firebase/auth";
import { collection, addDoc, getDocs , where, or , query } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../../firebaseConfig";
import { useRouter, useLocalSearchParams } from "expo-router";

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
  const params = useLocalSearchParams<{ latitude?: string; longitude?: string; name?: string }>();

  // 🔹 Récupère la position actuelle ou celle d'une adresse cliquée
  useEffect(() => {
    (async () => {
      const lat = params?.latitude ? parseFloat(params.latitude as string) : undefined;
      const lon = params?.longitude ? parseFloat(params.longitude as string) : undefined;

      if (typeof lat === "number" && !Number.isNaN(lat) && typeof lon === "number" && !Number.isNaN(lon)) {
        setRegion({ latitude: lat, longitude: lon, latitudeDelta: 0.01, longitudeDelta: 0.01 });
        return;
      }

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission refusée", "L’accès à la localisation est nécessaire.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    })();

    loadAddresses();
  }, [params?.latitude, params?.longitude]);

// 🔹 Charge uniquement les adresses visibles pour l'utilisateur
const loadAddresses = async () => {
  try {
    const currentUser = auth.currentUser?.email;
    console.log("👤 Utilisateur actuel :", currentUser); // 👈 ici

    if (!currentUser) return;

    const addressesRef = collection(db, "addresses");

    // 🔍 On veut : (isPublic == true) OU (user == currentUser)
    const q = query(
      addressesRef,
      or(
        where("isPublic", "==", true),
        where("user", "==", currentUser)
      )
    );

    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setMarkers(data);
  } catch (error) {
    console.error("Erreur lors du chargement :", error);
  }
};

  // 🔹 Clique sur la carte → prépare ajout d'adresse
  const handleAddMarker = (e: MapPressEvent) => {
    setSelectedCoord(e.nativeEvent.coordinate);
    setModalVisible(true);
  };

  // 🔹 Sélection d’image
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

  // 🔹 Sauvegarde l’adresse + image
  const saveAddress = async () => {
    if (!name.trim()) {
      Alert.alert("Erreur", "Veuillez entrer un nom d’adresse.");
      return;
    }

    let imageUrl = "";

    try {
      if (image) {
        const response = await fetch(image);
        const blob = await response.blob();
        const filename = `images/${Date.now()}_${auth.currentUser?.uid}.jpg`;
        const storageRef = ref(storage, filename);
        await uploadBytes(storageRef, blob);
        imageUrl = await getDownloadURL(storageRef);
      }

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
    router.replace("/"); // ✅ renvoie vers la page de connexion
  };

  if (!region)
    return <Text style={{ textAlign: "center", marginTop: 50 }}>Chargement de la carte...</Text>;

  return (
    <View style={styles.container}>
      {/* 🌍 Carte */}
      <MapView style={styles.map} region={region} onPress={handleAddMarker}>
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
          >
            {/* 📸 Si image → photo à la place du pin */}
            {marker.imageUrl ? (
              <Image
                source={{ uri: marker.imageUrl }}
                style={styles.markerImage}
              />
            ) : (
              <Image
                source={require("../../assets/images/icon.png")}
                style={styles.markerImage}
              />
            )}

            {/* 🏷️ Info-bulle au clic */}
            <Callout>
              <View style={{ maxWidth: 150 }}>
                <Text style={{ fontWeight: "bold" }}>{marker.name}</Text>
                <Text>{marker.description}</Text>
                <Text style={{ fontStyle: "italic", color: "#555" }}>
                  {marker.isPublic ? "🌍 Publique" : "🔒 Privée"}
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* 🔴 Bouton Déconnexion */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Déconnexion</Text>
      </TouchableOpacity>

      {/* 🏠 Modale d’ajout */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Nouvelle adresse</Text>

            <TextInput
              placeholder="Nom de l’adresse"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />

            <TextInput
              placeholder="Description"
              placeholderTextColor="#999"
              value={desc}
              onChangeText={setDesc}
              style={styles.input}
            />

            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <Text>Adresse publique ? </Text>
              <Switch value={isPublic} onValueChange={setIsPublic} />
            </View>

            <Button title="Choisir une photo" onPress={pickImage} />
            {image && (
              <View style={{ alignItems: "center", marginVertical: 8 }}>
                <Image source={{ uri: image }} style={styles.preview} />
                <Text>📸 Image sélectionnée</Text>
              </View>
            )}

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
  markerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "white",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
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
    color: "black",
  },
  preview: { width: 120, height: 120, borderRadius: 10, marginTop: 10 },
});
