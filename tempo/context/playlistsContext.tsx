import React, { createContext, useState, useContext, ReactNode, DO_NOT_USE_OR_YOU_WILL_BE_FIRED_CALLBACK_REF_RETURN_VALUES} from 'react';
export type playlist = {
    id: string;
    name: string;
    minBPM: string | number;
    maxBPM: string | number;
};
interface playlistsContextType {
    playlists: playlist[];
    addPlaylist: (name: string, minBPM: string | number, maxBPM: string | number)=> void;
}

const playlistsContext = createContext<playlistsContextType | undefined>(undefined);

export const PlaylistsProvider: React.FC<{ children: ReactNode}>=({children})=>{
    const [playlists, setPlaylists]=useState<playlist[]>([]);

    const addPlaylist = (name: string, minBPM: string | number, maxBPM: string | number)=>{
        const newPlaylist: playlist={
            id: Date.now().toString(),
            name,
            minBPM,
            maxBPM
        };
        setPlaylists((currentPlaylists)=> [...currentPlaylists, newPlaylist]);
    };
    
    return(
        <playlistsContext.Provider value={{playlists, addPlaylist}}>
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