import { Link, router  } from 'expo-router';
import { StyleSheet, TextInput, Button, Alert, ActivityIndicator } from 'react-native';
import React from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {Picker} from '@react-native-picker/picker'
import {usePlaylists} from '@/context/playlistsContext'
import {callBuildPlaylist} from '../api/spotify';
import {BuildPlaylistRequest} from '../api/types'
const TestInputExample = ()=>{
  const {addPlaylist} = usePlaylists();
  const [text, onChangeText] = React.useState('new playlist');
  const [selectedMinBPM, setSelectedMinBPM]=React.useState('70');
  const [selectedMaxBPM, setSelectedMaxBPM]=React.useState('200');
  const [isLoading, setIsLoading]=React.useState(false);

  const USER_ID= "Bellabopz";

  const handleCreatePlaylist = async ()=>{
    const minBPM= parseFloat(selectedMinBPM);
    const maxBPM= parseFloat(selectedMaxBPM);

  if (minBPM>=maxBPM){
    Alert.alert("Input Error", "Minimum BPM must be less than Maximum BPM.");
    return;
  }

  const requestBody: BuildPlaylistRequest={
    user_id: USER_ID,
    name:text.trim()||'BPM Playlist',
    queries:["genre:rock", "genre:house", "workout music"], //examples for now
    min_bpm:minBPM,
    max_bpm:maxBPM,
    description: `BPM: ${minBPM}-${maxBPM}.`,
    public:false,
  };
  setIsLoading(true);

  try{
    const summary = await callBuildPlaylist(requestBody);

    addPlaylist(requestBody.name, summary.min_bpm.toString(), summary.max_bpm.toString());

    Alert.alert(
      'Playlist Built!', 
      `"${summary.queries.join(',')}" tracks filtered. Added ${summary.added_count} tracks to playlist ID: ${summary.playlist_id}.`
    );

    router.back();
  }catch(error){
    console.error("API Call Failed:", error);
    Alert.alert(
      'Build failed',
      `Could not build spotify playlist. is flask server running? Error: ${(error as Error).message}`
    );
  }finally {
    setIsLoading(false);
  }
   
  }

  return (
    <ThemedView style={{padding:20}}>
      <ThemedText type="default">Playlist Name:</ThemedText>
      <TextInput
        style={styles.input}
        onChangeText={onChangeText}
        value={text}
        placeholder="Enter playlist name"
        placeholderTextColor='#aaa'
      />
      <ThemedText type="default">Minimum BPM:</ThemedText>
      <Picker
        selectedValue={selectedMinBPM}
        onValueChange={(itemValue)=>
          setSelectedMinBPM(itemValue)
        }>
        {['70', '80', '90', '100', '110', '120', '130', '140', '150'].map(bpm => 
                    <Picker.Item key={bpm} label={bpm} value={bpm}/>
                )}
      </Picker>
      <ThemedText type="default">Maximum BPM:</ThemedText>
      <Picker
        selectedValue={selectedMaxBPM}
        onValueChange={(itemValue)=>
          setSelectedMaxBPM(itemValue)
        }>
        {['70', '80', '90', '100', '110', '120', '130', '140', '150'].map(bpm => 
                    <Picker.Item key={bpm} label={bpm} value={bpm}/>
                )}
      </Picker>
      <Button
        title={isLoading ? "Building Playlist...": "Build Spotify Playlist"}
        onPress={handleCreatePlaylist}
        disabled={isLoading}
      />
      {isLoading && <ActivityIndicator size="small" style={{ marginTop: 10}}/>}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    borderColor: "white",
    padding: 10,
    color: "white",
  },
   
});

export default TestInputExample;