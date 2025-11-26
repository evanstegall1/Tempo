import { Image } from 'expo-image';
import { Platform, StyleSheet, ScrollView, Linking, TouchableOpacity,  ActivityIndicator,  } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link } from 'expo-router';
import {usePlaylists, playlist} from '@/context/playlistsContext'

const openSpotifyPlaylist=(spotifyId:string)=>{
  if(!spotifyId){
    console.warn("Spotify ID is missing for this playlist");
  }
  const url =`https://open.spotify.com/playlist/${spotifyId}`;
  Linking.openURL(url).catch((err)=>{
    console.error( "Failed to open Spoptify link:", err);
  });
};

const PlaylistItem: React.FC<{playlist: playlist}>=({playlist})=>(
  <TouchableOpacity
    //onPress={()=> openSpotifyPlaylist(playlist.spotifyId)}
    style={styles.playlistBoxWrapper}
  >
  <ThemedView style={styles.playlistBox}>
    <ThemedText type="subtitle" style={styles.playlistTitle}>
      {playlist.name}
      {playlist.isPublic && <ThemedText type="defaultSemiBold"> (Public)</ThemedText>}
    </ThemedText>

    <ThemedText type="default" style={styles.detailText}>
      <ThemedText type="defaultSemiBold">BPM Range:</ThemedText> {playlist.minBPM} - {playlist.maxBPM}
    </ThemedText>
  
    <ThemedText type="default" style={styles.detailText}>
      <ThemedText type="defaultSemiBold">Genres:</ThemedText> {playlist.genres.length>0 
      ? playlist.genres.map(g=> g.replace('genre:', '')).join(', ')
      : 'All'}
    </ThemedText>

    {playlist.artists.length>0 && (
      <ThemedText type="default" style={styles.detailText}>
        <ThemedText type= "defaultSemiBold">Artists:</ThemedText> {playlist.artists}
      </ThemedText>
    )}

    {playlist.description.length>0 &&(
      <ThemedText type="default" style={styles.descriptionText}>
        "{playlist.description}"
      </ThemedText>
    )}

    <ThemedText style={styles.linkPrompt}>Tap to open in Spotify</ThemedText>
  </ThemedView>
  </TouchableOpacity>
);
export default function HomeScreen() {
  const {playlists}=usePlaylists();
  return (
    <ScrollView style ={styles.container}>
      <ThemedView style={styles.headerImageContainer}>
        <Image
        source={require('@/assets/images/equalizer.png')}
        style={styles.equalizer}
        contentFit="cover"
        />
      </ThemedView>

      <ThemedView style={styles.content}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Your Saved Playlists</ThemedText>
      </ThemedView>
      
      
      <ThemedView style={styles.actionButtonContainer}>
        <Link href="/modal" asChild>
          <TouchableOpacity style={styles.newPlaylistButton}>
            <ThemedText style={styles.newPlaylistButtonText}>+ Create New Playlist</ThemedText>
          </TouchableOpacity>
        </Link>
      </ThemedView>

      <ThemedView style={styles.listSection}>
        {playlists.length>0?(
          playlists.map(item => <PlaylistItem key={item.id} playlist = {item}/>)
        ):(
          <ThemedView style={styles.emptyBox}>
          <ThemedText type="defaultSemiBold" style={styles.emptyMessage}>
            No playlists yet. Click 'Createn New Playlist' to begin!
          </ThemedText>
          </ThemedView>
        )}
      </ThemedView>
</ThemedView>
        
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    color: "#000000" 
  },
  headerImageContainer:{
    backgroundColor:"transparent",
    marginBottom: 16,
  },
  content:{
    paddingHorizontal:20,
    paddingBottom: 40,
  },
  titleContainer:{
    marginBottom:16,
  },
  actionButtonContainer:{
    marginBottom: 24,
  },
  newPlaylistButton:{
    backgroundColor: '#1DB954',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#1DB954',
    shadowOffset:{width:0, height:4},
    shadowOpacity:0.5,
    shadowRadius: 6,
    elevation:8,
  },
  newPlaylistButtonText:{
    color:'white',
    fontWeight:'bold',
    fontSize:18,
  },
  equalizer: {
    height: 250,
    width: '100%',
    resizeMode: 'cover',
    
  },
  listSection:{
    gap:12,
  },
  playlistBoxWrapper:{
    borderRadius:12,
    overflow:'hidden',
  },
  playlistBox:{
    padding:18,
    borderRadius:12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth:1,
    shadowColor:'#000',
    shadowOffset:{width:0, height:2},
    shadowOpacity:0.2,
    shadowRadius: 4,
    elevation:3,
    gap: 4,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  playlistTitle:{
    fontSize:18,
    fontWeight:'900',
    marginBottom:6, 
    color:'#fff',
  },
  detailText:{
    fontSize:14,
    color:'#aaa',
  },
  descriptionText:{
    marginTop:8,
    paddingTop:8, 
    borderTopWidth: 1,
    borderTopColor:'rgba(255, 255, 255, 0.05)',
    fontSize:14,
    fontStyle:'italic',
    color:'#888',
  },
  linkPrompt:{
    fontSize:12,
    marginTop:8, 
    color:'#1DB954',
    fontWeight:'bold',
    textAlign:'right',
  },
  emptyBox:{
    padding:20,
    borderRadius:12,
    backgroundColor:'rgba(255, 255, 255, 0.05)',
    alignItems:'center',
  },
  emptyMessage:{
    textAlign:'center',
    color:'#999',
  }
});