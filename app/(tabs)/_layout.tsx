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
        name="my-addresses"
        options={{
          title: "Mes adresses",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="place" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="auto-stories" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
