from flask import Flask, request, jsonify
from main import build_bpm_playlist
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

from main import build_pace_playlist

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
