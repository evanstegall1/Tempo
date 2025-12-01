//structure of data sent to endpoint
export interface BuildPlaylistRequest{
    user_id:string;
    access_token: string;
    name: string;
    queries: string[];
    min_bpm: number;
    max_bpm: number;
    description?: string;
    public?: boolean;
}
//structure of data recieved from endpoint
export interface PlaylistSummary{
    playlist_id: string;
    added_count: number;
    min_bpm:number;
    max_bpm: number;
    queries:string[];
    fell_back:boolean;
    bpm_stats:{
        total_input: number;
        missing_isrc: number;
        bp_lookup_failed: number;
        bpm_out_of_range_before_nprm: number;
        kept: number;
    };
    playlist_url: string;
}
export interface BuildPlaylistResponse {
    playlist_id: string; // Duplicated top-level ID
    summary: PlaylistSummary; // Nested summary object
    playback_started: boolean;
    playback_error: string | null;
}

export interface LivePaceRunRequest {
    pace_spm: number; 
    queries?: string[];
    name: string;
    description?: string;
    public?: boolean;
    access_token: string;
    user_id: string;
    device_id: string;
}

export interface LivePaceRunResponse {
    playlist_id: string;
    playlist_url: string;
    added_count: number;
    pace_spm: number;
    started: boolean; 
    error?: string; 
    playback_error?: string; 
}