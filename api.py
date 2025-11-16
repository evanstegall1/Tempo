from flask import Flask, request, jsonify
from main import build_bpm_playlist

app = Flask(__name__)

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
    )

    return jsonify(summary)

