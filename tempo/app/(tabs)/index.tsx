import { Image } from 'expo-image';
import { Platform, StyleSheet, ScrollView, Linking, TouchableOpacity, ActivityIndicator, } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link } from 'expo-router';
import { usePlaylists, playlist } from '@/context/playlistsContext'
import { useAuth } from '@/context/AuthContext';
import React, { useState } from 'react';

const openSpotifyPlaylist = (spotifyId: string) => {
  if (!spotifyId) {
    console.warn("Spotify ID is missing for this playlist");
    return;
  }
  const url = `https://open.spotify.com/playlist/${spotifyId}`;
  Linking.openURL(url).catch((err) => {
    console.error("Failed to open Spotify link:", err);
  });
};

const PlaylistItem: React.FC<{ playlist: playlist, onDelete: (id: string) => void }> = ({ playlist, onDelete }) => (
  <TouchableOpacity
    onPress={() => openSpotifyPlaylist(playlist.spotifyId)}
    style={styles.playlistBoxWrapper}
  >
    <ThemedView style={styles.playlistBox}>

      <ThemedView style={styles.titleRow}>
        <ThemedView style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>

          <ThemedText type="subtitle" style={styles.playlistTitle}>
            {playlist.name}
          </ThemedText>

          {playlist.isPublic && (
            <ThemedText type="defaultSemiBold" style={{ paddingLeft: 4 }}>
              (Public)
            </ThemedText>
          )}
        </ThemedView>

        <TouchableOpacity
          onPress={() =>

            onDelete(playlist.id)}
          style={styles.deleteButton}
        >
          <ThemedText style={styles.deleteButtonText}>delete</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ThemedText type="default" style={styles.detailText}>
        <ThemedText type="defaultSemiBold">BPM Range:</ThemedText>
        <ThemedText>{playlist.minBPM} - {playlist.maxBPM}</ThemedText>
      </ThemedText>

      <ThemedText type="default" style={styles.detailText}>
        <ThemedText type="defaultSemiBold">Genres:</ThemedText>
        <ThemedText>{playlist.genres.length > 0
          ? playlist.genres.map(g => g.replace('genre:', '')).join(', ')
          : 'All'}</ThemedText>
      </ThemedText>

      {playlist.artists.length > 0 && (
        <ThemedText type="default" style={styles.detailText}>
          <ThemedText type="defaultSemiBold">Artists:</ThemedText>
          <ThemedText>{playlist.artists}</ThemedText>
        </ThemedText>
      )}

      {playlist.description.length > 0 && (
        <ThemedText type="default" style={styles.descriptionText}>
          {playlist.description}
        </ThemedText>
      )}

      <ThemedText style={styles.linkPrompt}>Tap to open in Spotify</ThemedText>
    </ThemedView>
  </TouchableOpacity>
);
export default function HomeScreen() {
  const { playlists, removePlaylist } = usePlaylists();
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [playlistToDeleteId, setPlaylistToDeleteId] = useState<string | null>(null);
  const { signOut } = useAuth();

  const handleInitialDeletePress = (id: string) => {
    setShowDeleteWarning(true);
    setPlaylistToDeleteId(id);
  };

  const confirmDelete = () => {
    if (playlistToDeleteId) {
      removePlaylist(playlistToDeleteId);
      setPlaylistToDeleteId(null);
      setShowDeleteWarning(false);
    }
  };
  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.headerImageContainer}>
        <ThemedView style={styles.signOutButtonContainer}>
          <TouchableOpacity onPress={signOut} style={styles.signOutButton}>
            <ThemedText style={styles.signOutButtonText}>Sign Out</ThemedText>
          </TouchableOpacity>
        </ThemedView>
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

        {showDeleteWarning && (
          <ThemedView style={styles.warningBanner}>
            <ThemedText style={styles.warningText}>Warning: Deleting this entry will only remove the playlist object from the Tempo App. It will NOT delete the playlist from your Spotify account.</ThemedText>
            <ThemedView style={styles.warningActions}>
              <TouchableOpacity onPress={confirmDelete} style={[styles.warningButton, styles.warningConfirm]}>
                <ThemedText style={styles.warningConfirmText}>Confirm Delete</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowDeleteWarning(false)} style={styles.warningButton}>
                <ThemedText style={styles.warningCancelText}>Cancel</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        )}

        <ThemedView style={styles.listSection}>
          {playlists.length > 0 ? (
            playlists.map(item => <PlaylistItem key={item.id} playlist={item} onDelete={handleInitialDeletePress} />)
          ) : (
            <ThemedView style={styles.emptyBox}>
              <ThemedText type="defaultSemiBold" style={styles.emptyMessage}>No playlists yet. Click 'Create New Playlist' to begin!</ThemedText>
            </ThemedView>
          )}
        </ThemedView>
      </ThemedView>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  deleteButton: {
    padding: 4,
    backgroundColor: 'rgba(255, 99, 71, 0.1)',
    borderRadius: 8,
  },
  deleteButtonText: {
    fontSize: 18,
  },
  warningBanner: {
    backgroundColor: '#201A06',
    borderColor: '#FFD700',
    borderWidth: 1,
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
  },
  warningText: {
    color: '#FFD700',
    fontSize: 14,
    lineHeight: 20,
  },
  warningActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  warningButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  warningConfirm: {
    backgroundColor: '#CC3333',
  },
  warningConfirmText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  warningCancelText: {
    color: '#BDBDBD',
    fontWeight: 'bold',
    fontSize: 14,
  },
  signOutButtonContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    right: 20,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  signOutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  signOutButtonText: {
    color: '#FF6347',
    fontWeight: 'bold',
    fontSize: 14,
  },
  container: {
    flex: 1,
    backgroundColor: '#0B0B0D',
    paddingTop: Platform.OS === 'android' ? 8 : 0,
  },
  headerImageContainer: {
    backgroundColor: "transparent",
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  titleContainer: {
    marginBottom: 16,
  },
  actionButtonContainer: {
    marginBottom: 24,
  },
  newPlaylistButton: {
    backgroundColor: '#1DB954',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#0F7A3A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 8,
    elevation: 10,
  },
  newPlaylistButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  equalizer: {
    height: 250,
    width: '100%',
    resizeMode: 'cover',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,

  },
  listSection: {
    gap: 12,
  },
  playlistBoxWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  playlistBox: {
    padding: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
    gap: 6,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  playlistTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
    color: '#FFFFFF',
  },
  detailText: {
    fontSize: 14,
    color: '#CFCFCF',
  },
  descriptionText: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.03)',
    fontSize: 14,
    fontStyle: 'italic',
    color: '#BFBFBF',
  },
  linkPrompt: {
    fontSize: 12,
    marginTop: 8,
    color: '#1DB954',
    fontWeight: 'bold',
    textAlign: 'right',
  },
  emptyBox: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    alignItems: 'center',
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#BDBDBD',
  }
});
