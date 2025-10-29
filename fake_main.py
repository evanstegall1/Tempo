from dotenv import load_dotenv
from requests import post
import os, base64, json
import spotipy
from spotipy.oauth2 import SpotifyOAuth
from typing import List, Tuple


from bpm_lookup import bpm_from_isrc

SCOPES = "user-read-email playlist-modify-public playlist-modify-private"

# AUTH
load_dotenv()

client_id = os.getenv("CLIENT_ID")
client_secret = os.getenv("CLIENT_SECRET")

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


# PLAYLIST

def get_sp() -> spotipy.Spotify:
    return spotipy.Spotify(auth_manager=SpotifyOAuth(scope=SCOPES))

def search_spotify_tracks(sp: spotipy.Spotify, query: str, limit: int = 50):
    """Search tracks on Spotify. Returns full track objects."""
    res = sp.search(q=query, type="track", limit=min(50, limit))
    return res.get("tracks", {}).get("items", [])

def collect_candidates_from_queries(
    sp: spotipy.Spotify, queries: List[str], per_query_limit: int = 50
):
    items = []
    for q in queries:
        items.extend(search_spotify_tracks(sp, q, per_query_limit))
    seen = set()
    unique = []
    for t in items:
        tid = t["id"]
        if tid not in seen:
            seen.add(tid)
            unique.append(t)
    return unique

def filter_by_bpm(
    tracks: List[dict], min_bpm: float, max_bpm: float
) -> List[Tuple[str, float]]:
    kept = []
    for t in tracks:
        isrc = t.get("external_ids", {}).get("isrc")
        if not isrc:
            continue
        bpm = bpm_from_isrc(isrc)
        if bpm is not None and min_bpm <= bpm <= max_bpm:
            kept.append((t["uri"], bpm))
    return kept

def create_playlist(sp: spotipy.Spotify, user_id: str, name: str, description: str = "", public: bool = False) -> str:
    pl = sp.user_playlist_create(user=user_id, name=name, public=public, description=description)
    return pl["id"]

def add_to_playlist(sp: spotipy.Spotify, playlist_id: str, uris: List[str]):
    for i in range(0, len(uris), 100):
        sp.playlist_add_items(playlist_id, uris[i:i+100])

def build_bpm_playlist(
    user_id: str,
    name: str,
    queries: List[str],
    min_bpm: float,
    max_bpm: float,
    description: str = "",
    public: bool = False,
) -> dict:
    """
    1) searches Spotify using the provided queries,
    2) fetches BPM from Deezer via ISRC,
    3) filters to [min_bpm, max_bpm],
    4) creates a playlist and adds the songs.
    Returns a summary dict (playlist_id, added_count).
    """
    sp = get_sp()
    candidates = collect_candidates_from_queries(sp, queries, per_query_limit=25)
    enriched = []
    for t in candidates:
        if "external_ids" in t and "isrc" in t["external_ids"]:
            enriched.append(t)
        else:
            try:
                full = sp.track(t["id"])
                enriched.append(full)
            except Exception:
                pass

    picked = filter_by_bpm(enriched, min_bpm, max_bpm)
    uris = [uri for uri, _ in picked]

    playlist_id = create_playlist(sp, user_id, name, description, public)
    if uris:
        add_to_playlist(sp, playlist_id, uris)

    return {
        "playlist_id": playlist_id,
        "added_count": len(uris),
        "min_bpm": min_bpm,
        "max_bpm": max_bpm,
    }

if __name__ == "__main__":
    summary = build_bpm_playlist(
        user_id="stegallej",
        name="Running Playlist",
        queries=[
            "genre:rock",
            "genre:electronic",
            "running tempo",
            "drum and bass",
            "hard rock",
            "artist:Foo Fighters",
            "artist:Calvin Harris",
        ],
        min_bpm=160,
        max_bpm=175,
        description="Run",
        public=False,
    )
    print(summary)
