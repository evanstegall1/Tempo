import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import * as WebBrowser from "expo-web-browser";
import {
  useAuthRequest,
  ResponseType,
  makeRedirectUri,
  exchangeCodeAsync,
} from "expo-auth-session";
import { useRouter } from "expo-router";

WebBrowser.maybeCompleteAuthSession();

const SPOTIFY_CLIENT_ID = "61ef38017c3e4f7c92297931df2e3c87";

const SCOPES = [
  "playlist-modify-public",
  "playlist-modify-private",
  "user-read-private",
  "user-read-playback-state",
  "user-modify-playback-state",
  "streaming",
];

// Spotify OAuth endpoints
const discovery = {
  authorizationEndpoint: "https://accounts.spotify.com/authorize",
  tokenEndpoint: "https://accounts.spotify.com/api/token",
};

export default function LoginScreen() {
  const router = useRouter();

  // This becomes: tempo://redirect
  const redirectUri = makeRedirectUri({
    scheme: "tempo",
    path: "redirect",
  });

  console.log("Redirect URI:", redirectUri);

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: SPOTIFY_CLIENT_ID,
      scopes: SCOPES,
      responseType: ResponseType.Code, // Authorization Code
      usePKCE: true,                    // PKCE for public client
      redirectUri,
    },
    discovery
  );

  useEffect(() => {
    const handleAuth = async () => {
      if (response?.type === "success" && request) {
        const { code } = response.params;

        try {
          const tokenResult = await exchangeCodeAsync(
            {
              clientId: SPOTIFY_CLIENT_ID,
              code,
              redirectUri,
              extraParams: {
                grant_type: "authorization_code",
              },
            },
            discovery
          );

          const accessToken = tokenResult.accessToken;
          console.log("SPOTIFY ACCESS TOKEN:", accessToken);

          (globalThis as any).spotifyToken = accessToken;
          router.replace("/");
        } catch (err) {
          console.error("Error exchanging code for token:", err);
        }
      } else if (response && response.type !== "dismiss") {
        console.warn("Spotify auth did not succeed:", response);
      }
    };

    handleAuth();
  }, [response, request, router, redirectUri]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Tempo</Text>
      <Text style={styles.subtitle}>Login with Spotify to continue</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => promptAsync()}
        disabled={!request}
      >
        <Text style={styles.buttonText}>Login with Spotify</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#101010",
    justifyContent: "center",
    alignItems: "center",
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
    borderRadius: 999,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
});
