//structure of data sent to endpoint
export interface BuildPlaylistRequest{
    user_id:string;
    name: string;
    queries: string[];
    min_bpm: number;
    max_bpm: number;
    description?: string;
    public?: boolean;
}
//structure of data recieved from endpoint
export interface BuildPlaylistResponse{
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
}