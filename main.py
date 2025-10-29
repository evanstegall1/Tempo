from dotenv import load_dotenv
from requests import post
import os, base64, json, random
import spotipy
from spotipy.oauth2 import SpotifyOAuth
from typing import List, Tuple, Dict, Set, Optional

from bpm_lookup import bpm_from_isrc

SCOPES = "playlist-modify-public playlist-modify-private"

load_dotenv()
client_id = os.getenv("CLIENT_ID")
client_secret = os.getenv("CLIENT_SECRET")
REDIRECT_URI = os.getenv("SPOTIPY_REDIRECT_URI", "http://localhost:8888/callback")

def get_sp() -> spotipy.Spotify:
    return spotipy.Spotify(auth_manager=SpotifyOAuth(
        client_id=client_id,
        client_secret=client_secret,
        redirect_uri=REDIRECT_URI,
        scope=SCOPES
    ))

def get_token():
    auth_string = f"{client_id}:{client_secret}"
    auth_bytes = auth_string.encode("utf-8")
    auth_base64 = base64.b64encode(auth_bytes).decode("utf-8")

    url = "https://accounts.spotify.com/api/token"
    headers = {
        "Authorization": f"Basic {auth_base64}",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    data = {"grant_type": "client_credentials"}

    response = post(url, headers=headers, data=data)
    json_result = json.loads(response.content)
    token = json_result.get("access_token")
    if not token:
        raise Exception(f"Error getting token: {json_result}")
    return token

def get_auth_header(token):
    return {"Authorization": f"Bearer {token}"}

def search_tracks(sp: spotipy.Spotify, query: str, limit: int = 25) -> List[Dict]:
    """Track search. (genre: is ignored by track search)"""
    res = sp.search(q=query, type="track", limit=min(limit, 50))
    return res.get("tracks", {}).get("items", []) or []

def search_artists_by_genre(sp: spotipy.Spotify, genre: str, limit: int = 20) -> List[Dict]:
    """Genre filter works reliably for ARTIST search, not TRACK search."""
    res = sp.search(q=f'genre:"{genre}"', type="artist", limit=min(limit, 50))
    return res.get("artists", {}).get("items", []) or []

def search_artist_by_name(sp: spotipy.Spotify, name: str, limit: int = 3) -> List[Dict]:
    res = sp.search(q=f'artist:"{name}"', type="artist", limit=min(limit, 50))
    return res.get("artists", {}).get("items", []) or []

def artist_top_tracks(sp: spotipy.Spotify, artist_id: str, market: str = "US") -> List[Dict]:
    res = sp.artist_top_tracks(artist_id, country=market)
    return res.get("tracks", []) or []

def ensure_full_tracks(sp: spotipy.Spotify, tracks: List[Dict]) -> List[Dict]:
    """Some results lack external_ids; refetch to get ISRC when needed."""
    full = []
    for t in tracks:
        if t.get("external_ids", {}).get("isrc"):
            full.append(t)
        else:
            try:
                full.append(sp.track(t["id"]))
            except Exception:
                pass
    return full

def dedupe_tracks(tracks: List[Dict]) -> List[Dict]:
    seen: Set[str] = set()
    out: List[Dict] = []
    for t in tracks:
        tid = t.get("id")
        if not tid or tid in seen:
            continue
        seen.add(tid)
        out.append(t)
    return out

def filter_by_bpm(
    tracks: List[dict],
    min_bpm: float,
    max_bpm: float,
    debug: bool = False
) -> Tuple[List[Tuple[str, float]], Dict[str, int]]:
    kept: List[Tuple[str, float]] = []
    stats = {
        "total_input": len(tracks),
        "missing_isrc": 0,
        "bpm_lookup_failed": 0,
        "bpm_out_of_range_before_norm": 0,
        "kept": 0,
    }

    for t in tracks:
        isrc = t.get("external_ids", {}).get("isrc")
        if not isrc:
            stats["missing_isrc"] += 1
            continue

        title = t.get("name")
        artists = t.get("artists", [])
        artist_name = artists[0]["name"] if artists else None

        bpm = bpm_from_isrc(
            isrc,
            fallback_title=title,
            fallback_artist=artist_name,
            user_min_bpm=min_bpm,
            user_max_bpm=max_bpm,
        )

        if bpm is None:
            stats["bpm_lookup_failed"] += 1
            continue

        uri = t.get("uri")
        if uri:
            kept.append((uri, bpm))
            stats["kept"] += 1

    if debug:
        print("[BPM FILTER] Stats:", stats)
    return kept, stats

def create_playlist(sp: spotipy.Spotify, user_id: str, name: str, description: str = "", public: bool = False) -> str:
    pl = sp.user_playlist_create(user=user_id, name=name, public=public, description=description)
    return pl["id"]

def add_to_playlist(sp: spotipy.Spotify, playlist_id: str, uris: List[str]):
    for i in range(0, len(uris), 100):
        sp.playlist_add_items(playlist_id, uris[i:i+100])

def collect_candidates(
    sp: spotipy.Spotify,
    queries: List[str],
    *,
    artists_per_genre: int = 10,
    tracks_per_artist: int = 3,
    per_query_track_limit: int = 15,
    market: str = "US",
    shuffle: bool = True
) -> List[Dict]:
    pool: List[Dict] = []

    for q in queries:
        q_stripped = q.strip()
        if q_stripped.lower().startswith("genre:"):
            genre = q_stripped.split(":", 1)[1].strip().strip('"')
            artists = search_artists_by_genre(sp, genre, limit=artists_per_genre * 2)
            if shuffle:
                random.shuffle(artists)
            artists = artists[:artists_per_genre]
            for a in artists:
                top = artist_top_tracks(sp, a["id"], market=market)
                if shuffle:
                    random.shuffle(top)
                pool.extend(top[:tracks_per_artist])

        elif q_stripped.lower().startswith("artist:"):
            name = q_stripped.split(":", 1)[1].strip().strip('"')
            artists = search_artist_by_name(sp, name, limit=3)
            for a in artists:
                top = artist_top_tracks(sp, a["id"], market=market)
                if shuffle:
                    random.shuffle(top)
                pool.extend(top[:tracks_per_artist])

        else:
            pool.extend(search_tracks(sp, q_stripped, limit=per_query_track_limit))

    pool = dedupe_tracks(pool)
    if shuffle:
        random.shuffle(pool)
    return pool

def build_bpm_playlist(
    user_id: str,
    name: str,
    queries: List[str],
    min_bpm: float,
    max_bpm: float,
    description: str = "",
    public: bool = False,
    *,
    artists_per_genre: int = 10,
    tracks_per_artist: int = 3,
    per_query_track_limit: int = 15,
    market: str = "US",
    shuffle: bool = True,
    max_total_tracks: int = 100,
    debug: bool = True,
    fallback_if_empty: bool = True,
    fallback_threshold: int = 15
) -> dict:
    sp = get_sp()

    candidates = collect_candidates(
        sp,
        queries,
        artists_per_genre=artists_per_genre,
        tracks_per_artist=tracks_per_artist,
        per_query_track_limit=per_query_track_limit,
        market=market,
        shuffle=shuffle
    )
    if debug:
        print(f"[PIPELINE] Candidates collected: {len(candidates)}")

    enriched = ensure_full_tracks(sp, candidates)
    if debug:
        with_isrc = sum(1 for t in enriched if t.get("external_ids", {}).get("isrc"))
        print(f"[PIPELINE] Enriched tracks: {len(enriched)} | with ISRC: {with_isrc}")

    picked, stats = filter_by_bpm(enriched, min_bpm, max_bpm, debug=debug)
    uris = [uri for uri, _ in picked]

    if debug:
        print(f"[PIPELINE] BPM-kept count: {len(uris)} (range {min_bpm}-{max_bpm})")

    fell_back = False
    if fallback_if_empty and len(uris) < fallback_threshold:
        fell_back = True
        if debug:
            print(f"[FALLBACK] Only {len(uris)} tracks matched BPM. "
                  f"Falling back to unfiltered candidates (up to max_total_tracks).")
        uris = [t.get("uri") for t in enriched if t.get("uri")]
        if shuffle:
            random.shuffle(uris)

    if shuffle:
        random.shuffle(uris)
    uris = uris[:max_total_tracks]

    playlist_desc = description
    if fell_back:
        tag = f" [Fallback used: insufficient BPM matches for {min_bpm}-{max_bpm}]"
        if len(playlist_desc) + len(tag) <= 290:
            playlist_desc += tag

    playlist_id = create_playlist(sp, user_id, name, playlist_desc, public)
    if uris:
        add_to_playlist(sp, playlist_id, uris)

    return {
        "playlist_id": playlist_id,
        "added_count": len(uris),
        "min_bpm": min_bpm,
        "max_bpm": max_bpm,
        "queries": queries,
        "fell_back": fell_back,
        "bpm_stats": stats
    }

if __name__ == "__main__":
    summary = build_bpm_playlist(
        user_id="stegallej",
        name="Run!",
        queries=[
            "genre:rock",
            "genre:electronic",
            "running tempo",
            "drum and bass",
            "hard rock",
            "artist:Foo Fighters",
            "artist:Calvin Harris",
        ],
        min_bpm=115,
        max_bpm=135,
        description="...like there's lions, and tigers, and bears!",
        artists_per_genre=12,
        tracks_per_artist=2,
        per_query_track_limit=12,
        shuffle=True,
        max_total_tracks=80,
        debug=True,
        fallback_if_empty=True,
        fallback_threshold=15
    )
    print(summary)

