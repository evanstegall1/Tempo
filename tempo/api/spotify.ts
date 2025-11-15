import{BuildPlaylistRequest, BuildPlaylistResponse} from './types';

const FLASK_API_BASE_URL='76.72.29.135';

export async function callBuildPlaylist(
    requestBody: BuildPlaylistRequest,
): Promise<BuildPlaylistResponse>{
    const url=`${FLASK_API_BASE_URL}/build_playlist`;
    try{
        const response= await fetch(url, {
            method:'POST', 
            headers:{
                'Content-Type': 'application/json',
            },
            body:JSON.stringify(requestBody),
            signal: AbortSignal.timeout(30000),
        });

        if (!response.ok){
            const errorText= await response.text();
            throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorText}`);
        }

        const data: BuildPlaylistResponse =await response.json();
        return data;

    } catch (error){
        console.error("Error building playlist: ", error);
        throw error;
    }
}