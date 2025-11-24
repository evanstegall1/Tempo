import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";

WebBrowser.maybeCompleteAuthSession();

// --- SPOTIFY SETTINGS ---
const clientId = "YOUR_SPOTIFY_CLIENT_ID"; 
const redirectUri = "tempo://auth"; 
const scopes = [
  "user-read-private",
  "playlist-read-private",
  "user-read-email",
].join(" ");

export default function Login() {
  const router = useRouter();

  async function handleSpotifyLogin() {
    const authUrl =
      "https://accounts.spotify.com/authorize" +
      `?client_id=${clientId}` +
      "&response_type=code" +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scopes)}`;

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

    if (result.type === "success" && result.url.includes("?code=")) {
      const code = result.url.split("code=")[1];

      console.log("Authorization Code:", code);

      // TODO: Exchange code → access token using backend server

      router.replace("/(tabs)/playlists"); // Go to main app after login
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Tempo</Text>
      <Text style={styles.subtitle}>Login to continue</Text>

      <TouchableOpacity style={styles.button} onPress={handleSpotifyLogin}>
        <Text style={styles.buttonText}>Login with Spotify</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F10",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    color: "white",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: "#9aa0a6",
    marginBottom: 40,
  },
  button: {
    backgroundColor: "#1DB954",
    paddingVertical: 14,
    paddingHorizontal: 35,
    borderRadius: 50,
  },
  buttonText: {
    color: "black",
    fontWeight: "700",
    fontSize: 18,
  },
});
