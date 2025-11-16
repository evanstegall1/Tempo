import{BuildPlaylistRequest, BuildPlaylistResponse} from './types';

const FLASK_API_BASE_URL='https://practiceusernameforjosh.pythonanywhere.com';
const TIMEOUT_MS = 300000;

export async function callBuildPlaylist(
    requestBody: BuildPlaylistRequest,
): Promise<BuildPlaylistResponse>{
    const url=`${FLASK_API_BASE_URL}/build_playlist`;

    const controller  =  new AbortController();
    const timeoutId= setTimeout(()=> controller.abort(), TIMEOUT_MS);

    try{
        const response= await fetch(url, {
            method:'POST', 
            headers:{
                'Content-Type': 'application/json',
            },
            body:JSON.stringify(requestBody),
            signal:controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok){
            const errorText= await response.text();
            throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorText}`);
        }

        const data: BuildPlaylistResponse =await response.json();
        return data;

    } catch (error){
        clearTimeout(timeoutId);
        
        console.error("Error building playlist: ", error);
        throw error;
    }
}