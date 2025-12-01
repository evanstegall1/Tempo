from flask import Flask, request, jsonify, redirect
from main import (
    build_bpm_playlist,
    build_pace_playlist,
    get_sp_from_token,
)
from flask_cors import CORS
import os
from dotenv import load_dotenv
from spotipy.oauth2 import SpotifyOAuth, CacheFileHandler
import urllib.parse
import spotipy
from spotipy import SpotifyException

DOTENV_PATH = "/home/practiceusernameforjosh/Tempo/.env"
load_dotenv(DOTENV_PATH)
CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
SPOTIPY_REDIRECT_URI = os.getenv("SPOTIPY_REDIRECT_URI")
SCOPES = "playlist-modify-public playlist-modify-private user-read-private user-read-playback-state user-modify-playback-state streaming"
#MOBILE_REDIRECT_URI = "tempo://redirect"
client_secret_value = os.getenv("CLIENT_SECRET")
log_path = "/home/practiceusernameforjosh/Tempo/oauth_error.log"
with open(log_path, "a") as f:
    f.write(f" debug {client_secret_value}\n")
app = Flask(__name__)
CORS(app)



def get_spotify_auth_manager():
    #cache_handler = CacheFileHandler(cache_path="/home/practiceusernameforjosh/Tempo/.cache")
    return SpotifyOAuth(
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        redirect_uri=SPOTIPY_REDIRECT_URI,
        scope=SCOPES,
       # cache_handler=cache_handler
    )

@app.route("/api/pause-playback", methods=["POST"])
def pause_playback():
    data = request.get_json(force=True)
    access_token = data.get("access_token")
    if not access_token:
        return jsonify({"error": "access_token is required"}), 400

    sp = get_sp_from_token(access_token)
    try:
        sp.pause_playback()
        return jsonify({"status": "paused"}), 200
    except SpotifyException as e:

        return jsonify({"error": f"Spotify API Error: {e.msg}", "status_code": e.http_status}), e.http_status
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/skip-next", methods=["POST"])
def skip_next():
    data = request.get_json(force=True)
    access_token = data.get("access_token")
    if not access_token:
        return jsonify({"error": "access_token is required"}), 400

    sp = get_sp_from_token(access_token)
    try:

        sp.next_track()
        return jsonify({"status": "skipped_next"}), 200
    except SpotifyException as e:
        return jsonify({"error": f"Spotify API Error: {e.msg}", "status_code": e.http_status}), e.http_status
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/skip-previous", methods=["POST"])
def skip_previous():
    data = request.get_json(force=True)
    access_token = data.get("access_token")
    if not access_token:
        return jsonify({"error": "access_token is required"}), 400

    sp = get_sp_from_token(access_token)
    try:

        sp.previous_track()
        return jsonify({"status": "skipped_previous"}), 200
    except SpotifyException as e:
        return jsonify({"error": f"Spotify API Error: {e.msg}", "status_code": e.http_status}), e.http_status
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/auth/spotify/login')
def spotify_login():

    client_redirect_uri = request.args.get('client_redirect_uri')
    if not client_redirect_uri:
        return "Error: Missing client_redirect_uri", 400
    auth_manager = get_spotify_auth_manager()
    auth_url = auth_manager.get_authorize_url(
        state=client_redirect_uri,

    )
    return redirect(auth_url)

@app.route('/auth/spotify/callback')
def spotify_callback():
    code = request.args.get('code')

    original_state = request.args.get('state')

    if not original_state:
        return "Error: Missing original state", 400

    CLIENT_FINAL_REDIRECT_URI = original_state

    auth_manager = get_spotify_auth_manager()

    try:
        token_info = auth_manager.get_access_token(code, as_dict=True)
        access_token = token_info.get('access_token')

        sp = spotipy.Spotify(auth=access_token)
        current_user = sp.current_user()
        user_id = current_user.get('id', 'unknown_user')

        final_redirect_url = f"{CLIENT_FINAL_REDIRECT_URI}?" + urllib.parse.urlencode({
            'access_token': access_token,
            'user_id': user_id
        })

        return redirect(final_redirect_url)

    except Exception as e:
        try:
            with open("/home/practiceusernameforjosh/Tempo/oauth_error.log", "a") as f:
                f.write(f" Token Exchange FAILED: {e}\n")
        except Exception as file_err:
            print(f"FAILED TO WRITE TO LOG FILE: {file_err}")


        print(f"Token exchange error: {e}")
        return redirect(f"{CLIENT_FINAL_REDIRECT_URI}?error=token_exchange_failed")

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
    playlist_id = summary.get("playlist_id")
    
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
    """Build a playlist from the runner's pace (steps per minute)."""
    data = request.get_json(force=True)

    access_token = data.get("access_token")
    if not access_token:
        return jsonify({"error": "access_token is required"}), 400


    try:
        pace_spm = float(data["pace_spm"])
    except (TypeError, ValueError):
        return jsonify({"error": "pace_spm must be a number"}), 400

    user_id = data.get("user_id", "me")
    name = data.get("name", "Pace Playlist")
    queries = data.get("queries") or ["genre:rock"]
    mode = data.get("mode", "single")
    band_width = float(data.get("band_width", 10))

    summary = build_pace_playlist(
        user_id=user_id,
        name=name,
        queries=queries,
        pace_spm=pace_spm,
        mode=mode,
        band_width=band_width,
        access_token=access_token,

    )

    playlist_id = summary.get("playlist_id")

    play = data.get("play", True)
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
    """Start a live pace-based run and immediately start playback."""
    data = request.get_json(force=True)

    access_token = data.get("access_token")
    if not access_token:
        return jsonify({"error": "access_token is required"}), 400

    try:
        pace_spm = float(data["pace_spm"])
    except (TypeError, ValueError):
        return jsonify({"error": "pace_spm must be a number"}), 400

    device_id = data.get("device_id")
    queries = data.get("queries") or ["genre:rock"]
    name = data.get("name", "Live Pace Run")
    user_id = data.get("user_id", "me")


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

    playlist_id = summary.get("playlist_id")

    started = False
    error = None

    if playlist_id:
        sp = get_sp_from_token(access_token)
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
            "summary": summary,
        }
    )


if __name__ == "__main__":
    app.run(debug=True)
