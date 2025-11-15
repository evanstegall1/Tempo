import { Link, router  } from 'expo-router';
import { StyleSheet, TextInput, Button, Alert } from 'react-native';
import React from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {Picker} from '@react-native-picker/picker'
import {usePlaylists} from '@/context/playlistsContext'
const TestInputExample = ()=>{
  const {addPlaylist} = usePlaylists();
  const [text, onChangeText] = React.useState('new playlist');
  const [selectedMinBPM, setSelectedMinBPM]=React.useState('70');
  const [selectedMaxBPM, setSelectedMaxBPM]=React.useState('200');
  
  const handleCreatePlaylist = ()=>{
    addPlaylist(text, selectedMinBPM, selectedMaxBPM);
    Alert.alert('Playlist Created', `"${text}" has been added!`);
    router.back();
  }

  return (
    <ThemedView>
      <ThemedText type="default">Playlist Name:</ThemedText>
      <TextInput
        style={styles.input}
        onChangeText={onChangeText}
        value={text}
      />
      <ThemedText type="default">Minimum BPM:</ThemedText>
      <Picker
        selectedValue={selectedMinBPM}
        onValueChange={(itemValue, itemIndex)=>
          setSelectedMinBPM(itemValue)
        }>
        <Picker.Item label="70" value="70"/> 
        <Picker.Item label="80" value="80"/> 
        <Picker.Item label="90" value="90"/> 
        <Picker.Item label="100" value="100" />
        <Picker.Item label="110" value="110" />
        <Picker.Item label="120" value="120" />
        <Picker.Item label="200" value="200"/> 

      </Picker>
      <ThemedText type="default">Maximum BPM:</ThemedText>
      <Picker
        selectedValue={selectedMaxBPM}
        onValueChange={(itemValue, itemIndex)=>
          setSelectedMaxBPM(itemValue)
        }>
        <Picker.Item label="70" value="70"/> 
        <Picker.Item label="80" value="80"/> 
        <Picker.Item label="90" value="90"/> 
        <Picker.Item label="100" value="100" />
        <Picker.Item label="110" value="110" />
        <Picker.Item label="120" value="120" />
        <Picker.Item label="200" value="200"/> 
      </Picker>
      <Button
        title="Enter"
        onPress={handleCreatePlaylist}
      />
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