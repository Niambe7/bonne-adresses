// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#007bff",
        tabBarStyle: { backgroundColor: "#fff", borderTopWidth: 0.3 },
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          title: "Carte",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="map" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="public-addresses"
        options={{
          title: "Publiques",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="public" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="private-addresses"
        options={{
          title: "Privées",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="lock" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color} />
          ),
        }}
      />
      {/* Masquer 'home' si présent */}
      <Tabs.Screen name="home" options={{ href: null }} />
    </Tabs>
  );
}

