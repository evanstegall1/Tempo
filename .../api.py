from flask import Flask, request, jsonify
from backend.main import build_bpm_playlist, build_pace_playlist
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/ping", methods=["GET"])
def ping():
    return jsonify({"status": "ok"})

@app.route("/build_playlist", methods=["POST"])
def build_playlist():
    """
    Expected JSON body:

    {
      "user_id": "stegallej",
      "name": "Run!",
      "queries": ["genre:rock", "artist:Foo Fighters"],
      "min_bpm": 115,
      "max_bpm": 135,
      "description": "My running playlist",
      "public": false
    }
    """
    data = request.get_json(force=True)

    access_token = data.get("access_token")
    if not access_token:
        return jsonify({"error": "access_token is required"}), 400

    user_id = data["user_id"]
    name = data.get("name", "BPM Playlist")
    queries = data["queries"]
    min_bpm = float(data["min_bpm"])
    max_bpm = float(data["max_bpm"])
    description = data.get("description", "")
    public = bool(data.get("public", False))

    summary = build_bpm_playlist(
        user_id=user_id,
        name=name,
        queries=queries,
        min_bpm=min_bpm,
        max_bpm=max_bpm,
        description=description,
        public=public,
        access_token=access_token
    )

    return jsonify(summary)


# example route, feel free to modify

from backend.main import build_pace_playlist

@app.route("/api/pace-playlist", methods=["POST"])
def pace_playlist():
    """
    Expects JSON like:
    {
      "user_id": "...",
      "name": "Today's Run",
      "queries": ["genre:rock", "artist:Calvin Harris"],
      "pace_spm": 165,
      "mode": "single",
      "band_width": 12
    }
    """
    data = request.get_json(force=True)

    user_id   = data.get("user_id", "me")
    name      = data.get("name", "Pace Playlist")
    queries   = data.get("queries") or ["genre:rock"]
    pace_spm  = float(data["pace_spm"])   # required
    mode      = data.get("mode", "single")
    band_width = float(data.get("band_width", 10))

    summary = build_pace_playlist(
        user_id=user_id,
        name=name,
        queries=queries,
        pace_spm=pace_spm,
        mode=mode,
        band_width=band_width,
        # Optional tunables:
        artists_per_genre=data.get("artists_per_genre", 10),
        tracks_per_artist=data.get("tracks_per_artist", 3),
        per_query_track_limit=data.get("per_query_track_limit", 15),
        shuffle=data.get("shuffle", True),
        max_total_tracks=data.get("max_total_tracks", 80),
        debug=True,
        fallback_if_empty=True,
        fallback_threshold=15,
    )

    return jsonify(summary)

# another example route

from backend.main import build_pace_playlist, get_sp  # adjust import paths

app = Flask(__name__)

@app.route("/api/live-pace-run", methods=["POST"])
def live_pace_run():
    """
    Client sends:
    {
      "pace_spm": 170,
      "device_id": "<spotify device id>",
      "queries": ["genre:rock", "genre:electronic"],
      "name": "Live Run"
    }
    """
    data = request.get_json(force=True)
    pace_spm  = float(data["pace_spm"])
    device_id = data.get("device_id")
    queries   = data.get("queries") or ["genre:rock"]
    name      = data.get("name", "Pace Run")

    sp = get_sp()  # or get_sp_from_token(access_token_from_client)

    # 1) Build (or reuse) a pace-matched playlist
    summary = build_pace_playlist(
        user_id="me",                 # or the real user id
        name=name,
        queries=queries,
        pace_spm=pace_spm,           # from pedometer
        mode="single",
        band_width=12,
        description="Live pace-matched playlist",
        shuffle=True,
    )

    playlist_id = summary["playlist"]["id"]

    # 2) Start playback
    sp.start_playback(
        device_id=device_id,
        context_uri=f"spotify:playlist:{playlist_id}",
    )

    return jsonify({
        "playlist_id": playlist_id,
        "started": True,
        "pace_spm": pace_spm,
    })
