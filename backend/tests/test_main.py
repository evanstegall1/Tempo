import types
import pytest

import main


# ---------- Simple helpers ----------

def test_get_auth_header():
    header = main.get_auth_header("TOKEN123")
    assert header == {"Authorization": "Bearer TOKEN123"}


def test_search_tracks_uses_sp_search_correctly():
    class DummySp:
        def __init__(self):
            self.calls = []

        def search(self, q, type, limit):
            self.calls.append((q, type, limit))
            return {"tracks": {"items": [1, 2, 3]}}

    sp = DummySp()
    items = main.search_tracks(sp, "foo", limit=10)
    assert items == [1, 2, 3]
    assert sp.calls == [("foo", "track", 10)]


def test_search_artists_by_genre_builds_query():
    class DummySp:
        def __init__(self):
            self.calls = []

        def search(self, q, type, limit):
            self.calls.append((q, type, limit))
            return {"artists": {"items": ["a1", "a2"]}}

    sp = DummySp()
    items = main.search_artists_by_genre(sp, "rock", limit=5)
    assert items == ["a1", "a2"]
    assert sp.calls[0][0] == 'genre:"rock"'


def test_search_artist_by_name_builds_query():
    class DummySp:
        def __init__(self):
            self.calls = []

        def search(self, q, type, limit):
            self.calls.append((q, type, limit))
            return {"artists": {"items": ["x"]}}

    sp = DummySp()
    items = main.search_artist_by_name(sp, "Foo Fighters", limit=3)
    assert items == ["x"]
    assert 'artist:"Foo Fighters"' in sp.calls[0][0]


def test_artist_top_tracks_uses_country():
    class DummySp:
        def __init__(self):
            self.calls = []

        def artist_top_tracks(self, artist_id, country):
            self.calls.append((artist_id, country))
            return {"tracks": [1, 2]}

    sp = DummySp()
    tracks = main.artist_top_tracks(sp, "ARTIST", market="US")
    assert tracks == [1, 2]
    assert sp.calls == [("ARTIST", "US")]


# ---------- ensure_full_tracks & dedupe ----------

def test_ensure_full_tracks_refetches_missing_isrc():
    class DummySp:
        def __init__(self):
            self.calls = []

        def track(self, tid):
            self.calls.append(tid)
            return {"id": tid, "external_ids": {"isrc": "ISRC_" + tid}}

    sp = DummySp()
    input_tracks = [
        {"id": "1", "external_ids": {"isrc": "EXISTING"}},
        {"id": "2", "external_ids": {}},
    ]

    out = main.ensure_full_tracks(sp, input_tracks)
    assert len(out) == 2
    assert out[0]["external_ids"]["isrc"] == "EXISTING"
    assert out[1]["external_ids"]["isrc"] == "ISRC_2"
    assert sp.calls == ["2"]


def test_dedupe_tracks_by_id():
    tracks = [
        {"id": "1"},
        {"id": "2"},
        {"id": "1"},  # duplicate
        {"id": None},  # ignored
    ]
    out = main.dedupe_tracks(tracks)
    assert len(out) == 2
    assert {t["id"] for t in out} == {"1", "2"}


# ---------- filter_by_bpm + bpm_from_isrc integration ----------

def test_filter_by_bpm_counts_stats(monkeypatch):
    # Fake bpm_from_isrc to control outcomes
    def fake_bpm_from_isrc(isrc, **kwargs):
        if isrc == "MISS":
            return None
        if isrc == "SLOW":
            return 80.0
        return 120.0

    monkeypatch.setattr(main, "bpm_from_isrc", fake_bpm_from_isrc)

    tracks = [
        {"uri": "spotify:1", "external_ids": {"isrc": "OK"}},
        {"uri": "spotify:2", "external_ids": {"isrc": "MISS"}},
        {"uri": "spotify:3", "external_ids": {}},
    ]

    kept, stats = main.filter_by_bpm(tracks, min_bpm=100, max_bpm=130, debug=False)
    assert kept == [("spotify:1", 120.0)]
    assert stats["total_input"] == 3
    assert stats["missing_isrc"] == 1
    assert stats["bpm_lookup_failed"] == 1
    assert stats["kept"] == 1


# ---------- playlist helpers ----------

def test_create_playlist_uses_current_user_and_returns_id():
    class DummySp:
        def __init__(self):
            self.created = []

        def current_user(self):
            return {"id": "actual_user"}

        def user_playlist_create(self, user, name, public, description):
            self.created.append((user, name, public, description))
            return {"id": "playlist123"}

    sp = DummySp()
    pid = main.create_playlist(sp, user_id="ignored", name="My List", description="desc", public=True)
    assert pid == "playlist123"
    assert sp.created == [("actual_user", "My List", True, "desc")]


def test_add_to_playlist_batches_uris():
    batches = []

    class DummySp:
        def playlist_add_items(self, playlist_id, uris):
            batches.append((playlist_id, list(uris)))

    sp = DummySp()
    uris = [f"spotify:{i}" for i in range(205)]
    main.add_to_playlist(sp, "pl1", uris)

    # 205 in batches of 100 -> 3 calls: 100 + 100 + 5
    assert len(batches) == 3
    assert len(batches[0][1]) == 100
    assert len(batches[1][1]) == 100
    assert len(batches[2][1]) == 5
    assert batches[0][0] == "pl1"


def test_get_user_id_success():
    class DummySp:
        def current_user(self):
            return {"id": "user123"}

    assert main.get_user_id(DummySp()) == "user123"


# ---------- collect_candidates ----------

def test_collect_candidates_handles_genre_artist_and_plain(monkeypatch):
    calls = {
        "genre": [],
        "artist": [],
        "track": [],
    }

    def fake_search_artists_by_genre(sp, genre, limit):
        calls["genre"].append((genre, limit))
        return [{"id": "g1"}, {"id": "g2"}]

    def fake_artist_top_tracks(sp, artist_id, market):
        return [{"id": f"top-{artist_id}1"}, {"id": f"top-{artist_id}2"}]

    def fake_search_artist_by_name(sp, name, limit):
        calls["artist"].append((name, limit))
        return [{"id": "a1"}]

    def fake_search_tracks(sp, query, limit):
        calls["track"].append((query, limit))
        return [{"id": "t1"}, {"id": "t2"}]

    monkeypatch.setattr(main, "search_artists_by_genre", fake_search_artists_by_genre)
    monkeypatch.setattr(main, "artist_top_tracks", fake_artist_top_tracks)
    monkeypatch.setattr(main, "search_artist_by_name", fake_search_artist_by_name)
    monkeypatch.setattr(main, "search_tracks", fake_search_tracks)

    class DummySp:
        pass

    sp = DummySp()

    queries = [
        "genre:rock",
        'artist:"Foo Fighters"',
        "running music",
    ]
    pool = main.collect_candidates(
        sp,
        queries,
        artists_per_genre=1,
        tracks_per_artist=1,
        per_query_track_limit=2,
        shuffle=False,  # deterministic for test
    )

    # We expect at least one track from each path
    ids = [t["id"] for t in pool]
    assert any(id.startswith("top-") for id in ids)
    assert "t1" in ids or "t2" in ids
    assert calls["genre"]
    assert calls["artist"]
    assert calls["track"]


# ---------- bpm_band_for_pace ----------

def test_bpm_band_for_pace_single_mode():
    min_bpm, max_bpm = main.bpm_band_for_pace(steps_per_minute=170, mode="single", band_width=10)
    assert min_bpm == pytest.approx(165.0)
    assert max_bpm == pytest.approx(175.0)


def test_bpm_band_for_pace_double_mode():
    min_bpm, max_bpm = main.bpm_band_for_pace(steps_per_minute=170, mode="double", band_width=20)
    # target = 340, band 330–350, then clamped to [40, 240]
    assert min_bpm == 40.0
    assert max_bpm == 240.0


def test_bpm_band_for_pace_invalid_steps_raises():
    with pytest.raises(ValueError):
        main.bpm_band_for_pace(0)


def test_bpm_band_for_pace_unknown_mode():
    with pytest.raises(ValueError):
        main.bpm_band_for_pace(170, mode="weird")


# ---------- build_bpm_playlist (high-level) ----------

def test_build_bpm_playlist_happy_path(monkeypatch):
    """Smoke-test: ensure we call helpers and build expected summary structure."""
    fake_sp = object()

    def fake_collect(sp, queries, **kwargs):
        assert sp is fake_sp
        return [{"id": "t1", "uri": "spotify:1"}]

    def fake_ensure(sp, tracks):
        return tracks

    def fake_filter(tracks, min_bpm, max_bpm, debug=False):
        assert min_bpm == 120.0
        assert max_bpm == 130.0
        return [("spotify:1", 125.0)], {"kept": 1}

    playlist_created = {}

    def fake_create(sp, user_id, name, description, public):
        playlist_created["args"] = (user_id, name, description, public)
        return "pl123"

    added_items = []

    def fake_add(sp, playlist_id, uris):
        added_items.extend(uris)

    monkeypatch.setattr(main, "collect_candidates", fake_collect)
    monkeypatch.setattr(main, "ensure_full_tracks", fake_ensure)
    monkeypatch.setattr(main, "filter_by_bpm", fake_filter)
    monkeypatch.setattr(main, "create_playlist", fake_create)
    monkeypatch.setattr(main, "add_to_playlist", fake_add)

    # We force our own sp by monkeypatching get_sp_from_token
    def fake_get_sp_from_token(token):
        return fake_sp

    monkeypatch.setattr(main, "get_sp_from_token", fake_get_sp_from_token)

    summary = main.build_bpm_playlist(
        user_id="me",
        name="Run!",
        queries=["genre:rock"],
        min_bpm=120.0,
        max_bpm=130.0,
        description="desc",
        public=False,
        access_token="TOKEN123",
    )

    assert summary["playlist_id"] == "pl123"
    assert summary["added_count"] == 1
    assert summary["min_bpm"] == 120.0
    assert summary["max_bpm"] == 130.0
    assert summary["bpm_stats"]["kept"] == 1
    assert summary["playlist_url"].endswith("pl123")
    assert added_items == ["spotify:1"]


def test_build_bpm_playlist_fallback_used(monkeypatch):
    """If not enough BPM matches, falls back to enrichment-only URIs."""
    fake_sp = object()

    def fake_collect(sp, queries, **kwargs):
        return [{"uri": "spotify:1"}, {"uri": "spotify:2"}]

    def fake_ensure(sp, tracks):
        return tracks

    def fake_filter(tracks, min_bpm, max_bpm, debug=False):
        # simulate zero matches
        return [], {"kept": 0}

    def fake_create(sp, user_id, name, description, public):
        # we inspect description to ensure fallback tag is appended
        assert "Fallback used" in description
        return "pl_fb"

    def fake_add(sp, pid, uris):
        # nothing special here
        pass

    monkeypatch.setattr(main, "collect_candidates", fake_collect)
    monkeypatch.setattr(main, "ensure_full_tracks", fake_ensure)
    monkeypatch.setattr(main, "filter_by_bpm", fake_filter)
    monkeypatch.setattr(main, "create_playlist", fake_create)
    monkeypatch.setattr(main, "add_to_playlist", fake_add)
    monkeypatch.setattr(main, "get_sp_from_token", lambda token: fake_sp)

    summary = main.build_bpm_playlist(
        user_id="user",
        name="Fallback Test",
        queries=["genre:rock"],
        min_bpm=100,
        max_bpm=110,
        description="base",
        public=False,
        access_token="TOKEN",
        fallback_if_empty=True,
        fallback_threshold=5,  # we force < threshold -> fallback
    )

    assert summary["fell_back"] is True
    assert summary["playlist_id"] == "pl_fb"


# ---------- build_pace_playlist & play_playlist_now ----------

def test_build_pace_playlist_delegates_to_build_bpm(monkeypatch):
    recorded_kwargs = {}

    def fake_build_bpm_playlist(**kwargs):
        recorded_kwargs.update(kwargs)
        return {"playlist_id": "pl_pace", "min_bpm": kwargs["min_bpm"], "max_bpm": kwargs["max_bpm"]}

    monkeypatch.setattr(main, "build_bpm_playlist", fake_build_bpm_playlist)

    summary = main.build_pace_playlist(
        user_id="me",
        name="Pace Run",
        queries=["genre:rock"],
        pace_spm=170.0,
        mode="single",
        band_width=10,
        access_token="TOKEN",
    )

    assert summary["playlist_id"] == "pl_pace"
    assert recorded_kwargs["user_id"] == "me"
    assert recorded_kwargs["name"] == "Pace Run"
    assert pytest.approx(recorded_kwargs["min_bpm"]) == 165.0
    assert pytest.approx(recorded_kwargs["max_bpm"]) == 175.0


def test_play_playlist_now_calls_start_playback():
    calls = []

    class DummySp:
        def start_playback(self, device_id=None, context_uri=None):
            calls.append((device_id, context_uri))

    sp = DummySp()
    main.play_playlist_now(sp, playlist_id="pl123", device_id="dev1")
    assert calls == [("dev1", "spotify:playlist:pl123")]

