from flask import Flask, request, jsonify
from flask_cors import CORS

from main import (
    build_bpm_playlist,
    build_pace_playlist,
    get_sp_from_token,  # use the access token from the client
)

app = Flask(__name__)
CORS(app)


@app.route("/ping", methods=["GET"])
def ping():
    return jsonify({"status": "ok"})


@app.route("/build-playlist", methods=["POST"])
def build_playlist():
    """
    Build a playlist from an explicit BPM range.

    Expected JSON body:

    {
      "access_token": "...",          # required
      "user_id": "stegallej",
      "name": "Run!",
      "queries": ["genre:rock", "artist:Foo Fighters"],
      "min_bpm": 115,
      "max_bpm": 135,
      "description": "My running playlist",
      "public": false,

      "play": true,                   # optional: auto-start playback
      "device_id": "<spotify device id>"  # optional
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

    # build the playlist using your existing main.py logic
    summary = build_bpm_playlist(
        user_id=user_id,
        name=name,
        queries=queries,
        min_bpm=min_bpm,
        max_bpm=max_bpm,
        description=description,
        public=public,
        access_token=access_token,
    )

    playlist_id = (
        summary.get("playlist", {}).get("id")
        or summary.get("playlist_id")
    )

    # optional playback
    play = bool(data.get("play", False))
    playback_started = False
    playback_error = None

    if play and playlist_id:
        sp = get_sp_from_token(access_token)
        try:
            sp.start_playback(
                device_id=data.get("device_id"),
                context_uri=f"spotify:playlist:{playlist_id}",
            )
            playback_started = True
        except Exception as e:
            playback_error = str(e)

    return jsonify(
        {
            "summary": summary,
            "playlist_id": playlist_id,
            "playback_started": playback_started,
            "playback_error": playback_error,
        }
    )


@app.route("/api/pace-playlist", methods=["POST"])
def pace_playlist():
    """
    Build a playlist from the runner's pace (steps per minute).

    Expected JSON body:

    {
      "access_token": "...",          # required
      "user_id": "stegallej",
      "name": "Today's Run",
      "queries": ["genre:rock", "artist:Calvin Harris"],
      "pace_spm": 165,
      "mode": "single",
      "band_width": 12,

      "play": true,                   # optional (default true)
      "device_id": "<spotify device id>"   # optional
    }
    """
    data = request.get_json(force=True)

    access_token = data.get("access_token")
    if not access_token:
        return jsonify({"error": "access_token is required"}), 400

    user_id = data.get("user_id", "me")
    name = data.get("name", "Pace Playlist")
    queries = data.get("queries") or ["genre:rock"]
    pace_spm = float(data["pace_spm"])
    mode = data.get("mode", "single")
    band_width = float(data.get("band_width", 10))

    summary = build_pace_playlist(
        user_id=user_id,
        name=name,
        queries=queries,
        pace_spm=pace_spm,
        mode=mode,
        band_width=band_width,
        artists_per_genre=data.get("artists_per_genre", 10),
        tracks_per_artist=data.get("tracks_per_artist", 3),
        per_query_track_limit=data.get("per_query_track_limit", 15),
        shuffle=data.get("shuffle", True),
        max_total_tracks=data.get("max_total_tracks", 80),
        debug=data.get("debug", False),
        fallback_if_empty=True,
        fallback_threshold=data.get("fallback_threshold", 15),
        access_token=access_token,
    )

    playlist_id = (
        summary.get("playlist", {}).get("id")
        or summary.get("playlist_id")
    )

    # default: play = True if not specified
    play = data.get("play")
    if play is None:
        play = True
    play = bool(play)

    playback_started = False
    playback_error = None

    if play and playlist_id:
        sp = get_sp_from_token(access_token)
        try:
            sp.start_playback(
                device_id=data.get("device_id"),
                context_uri=f"spotify:playlist:{playlist_id}",
            )
            playback_started = True
        except Exception as e:
            playback_error = str(e)

    return jsonify(
        {
            "summary": summary,
            "playlist_id": playlist_id,
            "pace_spm": pace_spm,
            "playback_started": playback_started,
            "playback_error": playback_error,
        }
    )


@app.route("/api/live-pace-run", methods=["POST"])
def live_pace_run():
    """
    Start a live pace-based run and immediately start playback.

    Expected JSON body:

    {
      "access_token": "...",          # required
      "user_id": "stegallej",
      "pace_spm": 170,
      "device_id": "<spotify device id>",
      "queries": ["genre:rock", "genre:electronic"],
      "name": "Live Run"
    }
    """
    data = request.get_json(force=True)

    access_token = data.get("access_token")
    if not access_token:
        return jsonify({"error": "access_token is required"}), 400

    pace_spm = float(data["pace_spm"])
    device_id = data.get("device_id")
    queries = data.get("queries") or ["genre:rock"]
    name = data.get("name", "Pace Run")
    user_id = data.get("user_id", "me")

    sp = get_sp_from_token(access_token)

    # Build a pace-matched playlist
    summary = build_pace_playlist(
        user_id=user_id,
        name=name,
        queries=queries,
        pace_spm=pace_spm,
        mode="single",
        band_width=12,
        description="Live pace-matched playlist",
        shuffle=True,
        access_token=access_token,
    )

    playlist_id = (
        summary.get("playlist", {}).get("id")
        or summary.get("playlist_id")
    )

    started = False
    error = None

    if playlist_id:
        try:
            sp.start_playback(
                device_id=device_id,
                context_uri=f"spotify:playlist:{playlist_id}",
            )
            started = True
        except Exception as e:
            error = str(e)

    return jsonify(
        {
            "playlist_id": playlist_id,
            "started": started,
            "error": error,
            "pace_spm": pace_spm,
        }
    )


if __name__ == "__main__":
    # This is the part that actually starts your server!
    app.run(debug=True)


