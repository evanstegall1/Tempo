import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { PlaylistsProvider } from '@/context/playlistsContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {AuthProvider, useAuth} from '@/context/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import React, {useEffect} from 'react';

function useProtectedRoute(session: string | null, isLoading:boolean){
  const segments=useSegments();
  const router=useRouter();

  useEffect(()=>{
    if(isLoading) return;

    const inAuthGroup=segments[0]==='(auth)';

    if(session && inAuthGroup){
      router.replace('/(tabs)');
    }else if (!session && !inAuthGroup){
      router.replace('/(auth)/login');
    }
  },[session, isLoading, segments]);
}

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const {session, isLoading}=useAuth();

  useProtectedRoute(session, isLoading);

  if(isLoading){
    return(
      <View style={{flex:1, justifyContent:'center', alignItems: 'center'}}>
        <ActivityIndicator size="large"/>
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(auth)/login" options={{headerShown:false}}/>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Create New Playlist' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout(){
  return(
    <PlaylistsProvider>
      <AuthProvider>
        <RootLayoutContent/>
      </AuthProvider>
    </PlaylistsProvider>
  );
}