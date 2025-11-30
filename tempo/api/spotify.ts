import{BuildPlaylistRequest, BuildPlaylistResponse} from './types';
import { useAuth } from '@/context/AuthContext'; 
import { Alert } from 'react-native'; 

const FLASK_API_BASE_URL='https://practiceusernameforjosh.pythonanywhere.com';
const TIMEOUT_MS = 300000;

export async function callBuildPlaylist(
    requestBody: Omit<BuildPlaylistRequest, 'access_token' | 'user_id'>,
    accessToken: string,
    userId: string,
    handleExpiredToken: (errorTitle: string, errorMessage: string) => void,
): Promise<BuildPlaylistResponse>{
    const url=`${FLASK_API_BASE_URL}/build_playlist`;

    const controller  =  new AbortController();
    const timeoutId= setTimeout(()=> controller.abort(), TIMEOUT_MS);

    const finalRequestBody = {
        ...requestBody,
        access_token: accessToken, 
        user_id: userId,           
    };

    try{
        const response= await fetch(url, {
            method:'POST', 
            headers:{
                'Content-Type': 'application/json',
            },
            body:JSON.stringify(finalRequestBody),
            signal:controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.status === 401) {
            const errorText = await response.text();
            
            
            handleExpiredToken(
                "Session Expired", 
                "Your Spotify session has expired. Please log in again."
            );
            
           
            throw new Error(`Authentication Expired! Status: 401, Details: ${errorText}`);
        }

        if (!response.ok){
            const errorText= await response.text();
            throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorText}`);
        }

        const data: BuildPlaylistResponse =await response.json();
        return data;

    } catch (error){
        clearTimeout(timeoutId);

        if (error instanceof Error && error.name === 'AbortError') {
             Alert.alert("Request Timed Out", "The playlist building process took too long. Please try again.");
        }
        
        console.error("Error building playlist: ", error);
        throw error;
    }
}