import json
import pytest

import api


@pytest.fixture
def client():
    api.app.config["TESTING"] = True
    with api.app.test_client() as c:
        yield c


def test_ping(client):
    resp = client.get("/ping")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data == {"status": "ok"}


# ---------- /build-playlist ----------

def test_build_playlist_requires_access_token(client):
    body = {
        "user_id": "u1",
        "name": "Run!",
        "queries": ["genre:rock"],
        "min_bpm": 115,
        "max_bpm": 135,
    }
    resp = client.post("/build-playlist", json=body)
    assert resp.status_code == 400
    assert resp.get_json()["error"] == "access_token is required"


def test_build_playlist_success_no_play(monkeypatch, client):
    def fake_build_bpm_playlist(**kwargs):
        # emulate your summary shape
        return {
            "playlist_id": "pl123",
            "added_count": 5,
            "min_bpm": kwargs["min_bpm"],
            "max_bpm": kwargs["max_bpm"],
            "queries": kwargs["queries"],
        }

    monkeypatch.setattr(api, "build_bpm_playlist", fake_build_bpm_playlist)

    calls = []

    class DummySp:
        def start_playback(self, device_id=None, context_uri=None):
            calls.append((device_id, context_uri))

    monkeypatch.setattr(api, "get_sp_from_token", lambda token: DummySp())

    body = {
        "access_token": "TOKEN",
        "user_id": "u1",
        "name": "Run!",
        "queries": ["genre:rock"],
        "min_bpm": 115,
        "max_bpm": 135,
        "description": "desc",
        "public": False,
        "play": False,
    }
    resp = client.post("/build-playlist", json=body)
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["playlist_id"] == "pl123"
    assert data["playback_started"] is False
    assert data["summary"]["added_count"] == 5
    assert calls == []  # no playback


def test_build_playlist_with_play_starts_playback(monkeypatch, client):
    def fake_build_bpm_playlist(**kwargs):
        # This time return nested playlist dict so the fallback
        # `summary.get("playlist", {}).get("id")` branch is exercised.
        return {"playlist": {"id": "pl_nested"}}

    monkeypatch.setattr(api, "build_bpm_playlist", fake_build_bpm_playlist)

    calls = []

    class DummySp:
        def start_playback(self, device_id=None, context_uri=None):
            calls.append((device_id, context_uri))

    monkeypatch.setattr(api, "get_sp_from_token", lambda token: DummySp())

    body = {
        "access_token": "TOKEN",
        "user_id": "u1",
        "queries": ["genre:rock"],
        "min_bpm": 100,
        "max_bpm": 120,
        "play": True,
        "device_id": "dev1",
    }

    resp = client.post("/build-playlist", json=body)
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["playlist_id"] == "pl_nested"
    assert data["playback_started"] is True
    assert calls == [("dev1", "spotify:playlist:pl_nested")]


# ---------- /api/pace-playlist ----------

def test_pace_playlist_requires_access_token(client):
    body = {
        "user_id": "u1",
        "pace_spm": 170,
    }
    resp = client.post("/api/pace-playlist", json=body)
    assert resp.status_code == 400
    assert resp.get_json()["error"] == "access_token is required"


def test_pace_playlist_success_and_default_play(monkeypatch, client):
    def fake_build_pace_playlist(**kwargs):
        return {
            "playlist_id": "pl_pace",
            "min_bpm": 165,
            "max_bpm": 175,
        }

    monkeypatch.setattr(api, "build_pace_playlist", fake_build_pace_playlist)

    calls = []

    class DummySp:
        def start_playback(self, device_id=None, context_uri=None):
            calls.append((device_id, context_uri))

    monkeypatch.setattr(api, "get_sp_from_token", lambda token: DummySp())

    body = {
        "access_token": "TOKEN",
        "user_id": "me",
        "pace_spm": 170,
        "queries": ["genre:rock"],
        # omit "play" -> defaults to True
        "device_id": "devX",
    }

    resp = client.post("/api/pace-playlist", json=body)
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["playlist_id"] == "pl_pace"
    assert data["pace_spm"] == 170.0
    assert data["playback_started"] is True
    assert calls == [("devX", "spotify:playlist:pl_pace")]


# ---------- /api/live-pace-run ----------

def test_live_pace_run_requires_access_token(client):
    body = {
        "pace_spm": 170,
        "device_id": "dev",
    }
    resp = client.post("/api/live-pace-run", json=body)
    assert resp.status_code == 400
    assert resp.get_json()["error"] == "access_token is required"


def test_live_pace_run_builds_playlist_and_plays(monkeypatch, client):
    def fake_build_pace_playlist(**kwargs):
        return {"playlist_id": "pl_live"}

    calls = []

    class DummySp:
        def start_playback(self, device_id=None, context_uri=None):
            calls.append((device_id, context_uri))

    monkeypatch.setattr(api, "build_pace_playlist", fake_build_pace_playlist)
    monkeypatch.setattr(api, "get_sp_from_token", lambda token: DummySp())

    body = {
        "access_token": "TOKEN",
        "user_id": "me",
        "pace_spm": 180,
        "device_id": "devLIVE",
        "queries": ["genre:rock"],
        "name": "Live Run",
    }

    resp = client.post("/api/live-pace-run", json=body)
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["playlist_id"] == "pl_live"
    assert data["started"] is True
    assert data["pace_spm"] == 180.0
    assert calls == [("devLIVE", "spotify:playlist:pl_live")]
