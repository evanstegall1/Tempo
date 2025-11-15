import { Image } from 'expo-image';
import { Platform, StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link } from 'expo-router';
import {usePlaylists, playlist} from '@/context/playlistsContext'

const PlaylistItem: React.FC<{playlist: playlist}>=({playlist})=>(
  <ThemedView style={styles.playlistBox}>
    <ThemedText type="subtitle">{playlist.name}</ThemedText>
    <ThemedText type="default">BPM Range: {playlist.minBPM} - {playlist.maxBPM}</ThemedText>
  </ThemedView>
)
export default function HomeScreen() {
  const {playlists}=usePlaylists();
  return (
    <ScrollView style ={styles.container}>
      <ThemedView style={styles.headerImageContainer}>
        <Image
        source={require('@/assets/images/equalizer.png')}
        style={styles.equalizer}
        />
      </ThemedView>

      <ThemedView style={styles.content}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Saved Playlists</ThemedText>
      </ThemedView>
      
      
      <ThemedView style={styles.stepContainer}>
        <Link href="/modal">
          <Link.Trigger>
            <ThemedText type="link">+ New Playlist</ThemedText>
          </Link.Trigger>
          <Link.Preview />
        </Link>
      </ThemedView>
      <ThemedView>
        {playlists.length>0?(
          playlists.map(item => <PlaylistItem key={item.id} playlist = {item}/>)
        ):(
          <ThemedText type="defaultSemiBold" style={{ padding: 16}}>
            No playlists yet. Click '+ New Playlist' to begin!
          </ThemedText>
        )}
      </ThemedView>
</ThemedView>
        
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    color: "#040c53ff" 
  },
  headerImageContainer:{
    backgroundColor:"A1CEDC",
    marginBottom: 16,
  },
  content:{
    paddingHorizontal:16,
    paddingBottom: 50,
  },
  titleContainer:{
    flexDirection:'row',
    alignItems:'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 16,
  },
  equalizer: {
    height: 300,
    width: '100%',
    resizeMode: 'cover',
    
  },
  playlistBox:{
    padding:15,
    marginVertical: 4,
    borderRadius:8,
    borderWidth:1,
    borderColor:'#ccc',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyMessage:{
    padding:16
  }
});