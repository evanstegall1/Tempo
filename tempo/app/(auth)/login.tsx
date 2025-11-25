import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import * as AuthSession from "expo-auth-session";
import { useRouter } from "expo-router";

export default function LoginScreen() {
  const router = useRouter();

  async function handleSpotifyLogin() {
    const redirectUri = AuthSession.makeRedirectUri();

    const clientId = "YOUR_CLIENT_ID"; // backend should also needs this
    const scope = "user-read-private playlist-modify-public playlist-modify-private";

    const authUrl =
      `https://accounts.spotify.com/authorize` +
      `?client_id=${clientId}` +
      `&response_type=token` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scope)}`;

    // Open Spotify login
    const result = await AuthSession.startAsync({ authUrl });

    // If success, result.params contains the access token
    if (result.type === "success" && result.params.access_token) {
      const token = result.params.access_token;

      // Store token temporarily 
      globalThis.spotifyToken = token;

      // Navigate to main app
      router.replace("/(tabs)");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Tempo</Text>
      <Text style={styles.subtitle}>Login with Spotify to continue</Text>

      <TouchableOpacity style={styles.button} onPress={handleSpotifyLogin}>
        <Text style={styles.buttonText}>Login with Spotify</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#101010",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#ccc",
    marginBottom: 40,
  },
  button: {
    backgroundColor: "#1DB954",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 50,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
});
