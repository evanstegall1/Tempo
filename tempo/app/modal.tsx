import { Link, router  } from 'expo-router';
import { StyleSheet, TextInput, Button, Alert, ActivityIndicator, Switch, Platform, ScrollView, TouchableOpacity } from 'react-native';
import React from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {Picker} from '@react-native-picker/picker'
import {usePlaylists} from '@/context/playlistsContext'
import {callBuildPlaylist} from '../api/spotify';
import {BuildPlaylistRequest} from '../api/types'

const QUERY_OPTIONS=[
  {label: 'Pop', value:'genre:pop'},
  {label: 'Rap', value:'genre:rap'},
  {label: 'Rock', value:'genre:rock'},
  {label: 'Hip Hop', value:'genre:hip hop'},
  {label: 'Raggaeton', value:'genre:reggaeton'},
  {label: 'Pov: indie', value:'genre:pov: indie'},
  {label: 'Latin Pop', value:'genre:latin pop'},
  {label: 'K-Pop', value:'genre:k-pop'},
  {label: 'R&B', value:'genre:r&b'},
  {label: 'Singer-Songwriter', value:'genre:singer-songwriter'},
  {label: 'Country', value:'genre:country'},
  {label: 'EDM', value:'genre:edm'},
  {label: 'Soul', value:'genre:soul'},
  {label: 'Indie Pop', value:'genre:indie pop'},
  {label: 'Dance Pop', value:'genre:dance pop'},
  {label: 'House', value:'genre:house'},
  {label: 'Techno', value:'genre:techno'},
  {label: 'Jazz', value:'genre:jazz'},
  {label: 'Classical', value:'genre:classical'},
  {label: 'Metal', value:'genre:metal'},
  {label: 'Folk', value:'genre:folk'},
  {label: 'Punk', value:'genre:punk'},
  {label: 'Blues', value:'genre:blues'},
  {label: 'Gospel', value:'genre:gospel'},
  {label: 'Study Beats', value:'genre:study beats'},
  {label: 'Ambient', value:'genre:ambient'},
]
const MultiSelectQuery: React.FC<{
  options:{ label:string, value:string}[],
  selectedValues: string[],
  onToggle:(value:string)=>void, 
}>=({options, selectedValues, onToggle})=>(
  <ThemedView style={styles.multiSelectContainer}>
    {options.map((item)=>{
      const isSelected=selectedValues.includes(item.value);
      return(
        <TouchableOpacity
          key={item.value}
          style={[
            styles.queryPill,
            isSelected ? styles.queryPillSelected :styles.queryPillUnselected,
          ]}
          onPress={()=> onToggle(item.value)}
        >
          <ThemedText style={isSelected ? styles.pillTextSelected : styles.pillTextUnselected}>
            {item.label}
          </ThemedText>
        </TouchableOpacity>
      );
    })}
  </ThemedView>
);

//async function validateArtist(artistName: string): Promise<boolean>{

//} check artist exists
const TestInputExample = ()=>{
  const {addPlaylist} = usePlaylists();
  const [name, setName] = React.useState('new playlist');
  const [selectedMinBPM, setSelectedMinBPM]=React.useState('70');
  const [selectedMaxBPM, setSelectedMaxBPM]=React.useState('200');
  const [isLoading, setIsLoading]=React.useState(false);
  const [artistInput, setArtistInput] = React.useState('');
  const [selectedQueries, setSelectedQueries]= React.useState<string[]>([]);
  const [description, setDescription] = React.useState('');
  const [isPublic, setIsPublic]=React.useState(false)

  const USER_ID= "stegallej";

  const handleToggleQuery = (value: string)=>{
    setSelectedQueries(prev=>
      prev.includes(value)
        ? prev.filter(v=>v!==value)
        : [...prev, value]
    );
  };

  const handleCreatePlaylist = async ()=>{
    const minBPM= parseFloat(selectedMinBPM);
    const maxBPM= parseFloat(selectedMaxBPM);

  if (minBPM>=maxBPM){
    Alert.alert("Input Error", "Minimum BPM must be less than Maximum BPM.");
    return;
  }

  let queries: string[]=[];
  const artistNames=artistInput
    .split(',')
    .map(a=>a.trim())
    .filter(a=>a.length>0);

  if(selectedQueries.length===0){
    queries=QUERY_OPTIONS.map(q=>q.value);
  }else{
    queries=[...selectedQueries];
  }

  let allArtistsValid=true;
  let validArtistQueries: string[]=[];

  if(artistNames.length>0){
    setIsLoading(true);
    for(const artist of artistNames){
      //call backend validation function
      const isValid=true; //await validateArtist(artist);
      if (isValid){
        validArtistQueries.push(`artist:"${artist}"`);
      }else{
        allArtistsValid=false;
        Alert.alert(
          "Artist Not Found", `We couldn't find a matching artist for "${artist}" on Spotify. Please correct or remove them.`
        );
        break;
      }

    }setIsLoading(false);
  }
  if(!allArtistsValid){
    return;
  }

  queries = queries.concat(validArtistQueries);

  

  const requestBody: BuildPlaylistRequest={
    user_id: USER_ID,
    name:name.trim()||'BPM Playlist',
    queries:queries, //examples for now
    min_bpm:minBPM,
    max_bpm:maxBPM,
    description: description.trim() || `BPM: ${minBPM}-${maxBPM}.`,
    public: isPublic,
  };
  setIsLoading(true);

  try{
    const summary = await callBuildPlaylist(requestBody);

    addPlaylist(
      requestBody.name, 
      summary.min_bpm.toString(), 
      summary.max_bpm.toString(),
      description,
      artistInput,
      isPublic,
      selectedQueries);

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
    <ThemedView style={styles.container}>
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 80}}>
      <ThemedText type="default">Playlist Name:</ThemedText>
      <TextInput
        style={styles.input}
        onChangeText={setName}
        value={name}
        placeholder="Enter playlist name"
        placeholderTextColor='#000'
      />
      <ThemedText type="defaultSemiBold" style={{marginTop: 10}}>
        Optional: Select Genres:
      </ThemedText>
      <MultiSelectQuery
        options={QUERY_OPTIONS}
        selectedValues={selectedQueries}
        onToggle={handleToggleQuery}
      />
      <ThemedText type="default" style={{marginTop: 10}}>
        Optional: Add Specific Artists (Comma-separated): 
      </ThemedText>
      <TextInput
        style={[styles.input, { minHeight:60}]}
        onChangeText={setArtistInput}
        value={artistInput}
        multiline
        numberOfLines={3}
        autoCapitalize='none'
      />
      <ThemedText type="default">Description (Optional):</ThemedText>
      <TextInput
        style={[styles.input, {minHeight:60}]}
        onChangeText={setDescription}
        value={description}
        placeholder="bpm playlist"
        placeholderTextColor='#000'
        multiline
      />
      
      <ThemedText type="default">Minimum BPM:</ThemedText>
      <ThemedView style={styles.pickerContainer}>
      <Picker
        selectedValue={selectedMinBPM}
        onValueChange={(itemValue)=>
          setSelectedMinBPM(itemValue)
        }>
        {['70', '80', '90', '100', '110', '120', '130', '140', '150'].map(bpm => 
                    <Picker.Item key={bpm} label={bpm} value={bpm}/>
                )}
      </Picker>
      </ThemedView>
      <ThemedText type="default">Maximum BPM:</ThemedText>
      <ThemedView style={styles.pickerContainer}>
      <Picker
        selectedValue={selectedMaxBPM}
        onValueChange={(itemValue)=>
          setSelectedMaxBPM(itemValue)
        }>
        {['70', '80', '90', '100', '110', '120', '130', '140', '150'].map(bpm => 
                    <Picker.Item key={bpm} label={bpm} value={bpm}/>
                )}
      </Picker>
      </ThemedView>

      <ThemedView style={styles.switchContainer}>
        <ThemedText type="default">MAke Public:</ThemedText>
        <Switch
          onValueChange ={setIsPublic}
          value={isPublic}
        />
      </ThemedView>  
      <Button
        title={isLoading ? "Building Playlist...": "Build Spotify Playlist"}
        onPress={handleCreatePlaylist}
        disabled={isLoading}
      />
      {isLoading && <ActivityIndicator size="small" style={{ marginTop: 10}}/>}
    </ScrollView></ThemedView>
  );
};

const styles = StyleSheet.create({
  input: {
    height: 40,
    margin: 8,
    borderWidth: 1,
    borderColor: "black",
    padding: 10,
    color: "black",
    borderRadius: 4,
  },
  multiSelectContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginVertical: 8,
        gap: 8, 
    },
    queryPill: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
    },
    queryPillSelected: {
        backgroundColor: '#1DB954', 
        borderColor: '#1DB954',
    },
    queryPillUnselected: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderColor: '#ccc',
    },
    pillTextSelected: {
        color: 'white',
        fontWeight: 'bold',
    },
    pillTextUnselected: {
        color: '#ccc',
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 12,
    },
    container:{
      flex:1,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        overflow: 'hidden',
        marginVertical: 8,
        ...(Platform.OS === 'android' && { backgroundColor: 'rgba(255, 255, 255, 0.1)' }),
    }
});

export default TestInputExample;