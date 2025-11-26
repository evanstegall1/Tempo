import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";

WebBrowser.maybeCompleteAuthSession();

// real backend auth URL:
const BACKEND_AUTH_URL = "https://your-backend-url.com/login-with-spotify";
const REDIRECT_URI = "tempo://auth-callback";

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);

      const result = await WebBrowser.openAuthSessionAsync(
        BACKEND_AUTH_URL,
        REDIRECT_URI
      );

      console.log("Auth result:", result);

      if (result.type === "success") {
        router.replace("/(tabs)");
      }
    } catch (err) {
      console.log("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tempo</Text>
      <Text style={styles.subtitle}>Login with Spotify to continue</Text>

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.6 }]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.buttonText}>Login with Spotify</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000", 
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: "white",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#cccccc",
    marginBottom: 40,
  },
  button: {
    backgroundColor: "#1DB954", 
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 999,
  },
  buttonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "700",
  },
});

