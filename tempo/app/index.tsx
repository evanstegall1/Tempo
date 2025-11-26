import React from "react";
import { Redirect } from "expo-router";

export default function Index() {
  // if you're still using globalThis for now:
  const token = (globalThis as any).spotifyToken as string | undefined;

  if (!token) {
    // no token yet → go to login
    return <Redirect href="/(auth)/login" />;
  }

  // token exists → go to main tabs
  return <Redirect href="/(tabs)" />;
}