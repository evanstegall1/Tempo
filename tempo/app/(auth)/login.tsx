import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from 'expo-auth-session';
import { useRouter } from "expo-router";
import {useAuth} from "@/context/AuthContext";

WebBrowser.maybeCompleteAuthSession();
const SPOTIFY_CLIENT_ID = "61ef38017c3e4f7c92297931df2e3c87";
// real backend auth URL:
const BACKEND_AUTH_URL = "https://practiceusernameforjosh.pythonanywhere.com/auth/spotify/login";
const REDIRECT_URI = AuthSession.makeRedirectUri({
  scheme: 'tempo',
  path: 'redirect',
});

const discovery = {
    authorizationEndpoint: 'https://accounts.spotify.com/authorize',
};

export default function LoginScreen() {
  const {signIn} = useAuth();
  const [loading, setLoading] = useState(false);

  

  const handleLogin = async () => {
    try {
      setLoading(true);

     

      const finalAuthUrl = `${BACKEND_AUTH_URL}`;
      
      const result = await WebBrowser.openAuthSessionAsync(
        finalAuthUrl,
        REDIRECT_URI
      );

      if (result.type === "success") {
        const redirectUrl= result.url;

        const urlParams=new URLSearchParams(redirectUrl.split('?')[1]);
        const sessionToken=urlParams.get('access_token');

        if(sessionToken){
          await signIn(sessionToken);
        }else{
          Alert.alert("Login Failed", "Did not recieve a session token from the backend.");
          console.error("Authentication success, but missing session token.");
        }
      }else if(result.type==="cancel"){
        console.log("Login cancelled by user.");
      }else{
        console.log("Authentication failed or dismissed:", result.type);
      }
    } catch (err) {
      Alert.alert("Login Error", "An unexpected error occurred during the login process.");
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

