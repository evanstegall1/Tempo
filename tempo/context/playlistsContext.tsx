import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useState, useContext, ReactNode, useEffect} from 'react';
import { ActivityIndicator } from 'react-native';

const STORAGE_KEY = '@BPM_Playlists';
export type playlist = {
    id: string;
    name: string;
    minBPM: string | number;
    maxBPM: string | number;
    description: string;
    artists: string;
    isPublic: boolean;
    genres: string[];
};
interface playlistsContextType {
    playlists: playlist[];
    addPlaylist: (
        name: string, 
        minBPM: string | number, 
        maxBPM: string | number,
        description: string,
        artists: string,
        isPublic: boolean,
        genres: string[]
    )=> void;
    removePlaylist: (id:string)=> void;
}

const playlistsContext = createContext<playlistsContextType | undefined>(undefined);

export const PlaylistsProvider: React.FC<{ children: ReactNode}>=({children})=>{
    const [playlists, setPlaylists]=useState<playlist[]>([]);
    const [isLoading, setIsLoading]= useState(true);

    const savePlaylists= async (currentPlaylists: playlist[])=>{
        try{
            const jsonValue = JSON.stringify(currentPlaylists);
            await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
        } catch (e){
            console.error("Error saving playlists:", e);
        }
    };

    useEffect(()=>{
        const loadPlaylists = async ()=>{
    try{
        const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
        if(jsonValue !==null){
            setPlaylists(JSON.parse(jsonValue));
        }
    }catch (e){
        console.error("Error loading playlists:", e);
    }finally{
        setIsLoading(false);
    }
};
loadPlaylists();
}, []);

    const addPlaylist = (
        name: string, 
        minBPM: string | number, 
        maxBPM: string | number,
        description: string,
        artists: string,
        isPublic: boolean,
        genres: string[]
    )=>{
        const newPlaylist: playlist={
            id: Date.now().toString(),
            name,
            minBPM,
            maxBPM,
            description,
            artists,
            isPublic,
            genres,
        };
        setPlaylists((currentPlaylists)=> {
            const updatedPlaylists= [...currentPlaylists, newPlaylist];
            savePlaylists(updatedPlaylists);
            return updatedPlaylists;
    });
};

    const removePlaylist = (id: string) => {
        setPlaylists((currentPlaylists) => {
            const updatedPlaylists = currentPlaylists.filter(p => p.id !== id);
            savePlaylists(updatedPlaylists);
            return updatedPlaylists;
        });
    };

if (isLoading){
    return <ActivityIndicator size="large"/>;
}
    
    return(
        <playlistsContext.Provider value={{playlists, addPlaylist, removePlaylist}}>
            {children}
        </playlistsContext.Provider>
    );
};

export const usePlaylists=()=>{
    const context=useContext(playlistsContext);
    if(context===undefined){
        throw new Error('usePlaylists must be used within a PlaylistsProvider');
    }
    return context;
};