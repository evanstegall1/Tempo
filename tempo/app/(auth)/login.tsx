import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Image,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";

WebBrowser.maybeCompleteAuthSession();

// insert real backend URL later:
const BACKEND_AUTH_URL = "https://your-backend-url.com/auth/spotify";
const REDIRECT_URI = "tempo://auth-callback"; 

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);

    try {
      const result = await WebBrowser.openAuthSessionAsync(
        BACKEND_AUTH_URL,
        REDIRECT_URI
      );

      if (result.type === "success") {
        router.replace("/(tabs)");
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        
        {/* App Title */}
        <Text style={styles.title}>Tempo</Text>
        <Text style={styles.subtitle}>Move with your music.</Text>

        {/* Spotify Button */}
        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.6 }]}
          disabled={loading}
          onPress={handleLogin}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.buttonText}>Continue with Spotify</Text>
          )}
        </TouchableOpacity>

        {/* Footer */}
        <Text style={styles.footer}>
          By continuing, you agree to Tempo’s Terms and Privacy Policy.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0B0F14",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 42,
    fontWeight: "800",
    color: "white",
    letterSpacing: 1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#A9ABB3",
    marginBottom: 60,
  },
  button: {
    width: "100%",
    backgroundColor: "#1DB954",
    paddingVertical: 14,
    borderRadius: 50,
    alignItems: "center",
    shadowColor: "#1DB954",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "black",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    fontSize: 12,
    color: "#5F6269",
    textAlign: "center",
    paddingHorizontal: 40,
  },
});


