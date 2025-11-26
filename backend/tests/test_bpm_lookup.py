import json
import time
from types import SimpleNamespace

import pytest

import bpm_lookup


@pytest.fixture(autouse=True)
def reset_cache(tmp_path, monkeypatch):
    """Use a temp cache file and clear in-memory cache for each test."""
    cache_file = tmp_path / "bpm_cache.json"
    monkeypatch.setenv("BPM_CACHE_PATH", str(cache_file))
    bpm_lookup._cache.clear()
    yield
    # ensure cache is cleared after
    bpm_lookup._cache.clear()


# ---------- _normalize_bpm ----------

@pytest.mark.parametrize(
    "bpm,expected",
    [
        (60.0, 60.0),
        (120.0, 120.0),
        (bpm_lookup.MIN_VALID_BPM, bpm_lookup.MIN_VALID_BPM),
        (bpm_lookup.MAX_VALID_BPM, bpm_lookup.MAX_VALID_BPM),
    ],
)
def test_normalize_bpm_in_range(bpm, expected):
    assert bpm_lookup._normalize_bpm(bpm) == expected


def test_normalize_bpm_too_high_halved_into_range():
    too_high = bpm_lookup.MAX_VALID_BPM * 1.5
    result = bpm_lookup._normalize_bpm(too_high)
    assert result == pytest.approx(too_high / 2.0)


def test_normalize_bpm_too_low_doubled_into_range():
    too_low = bpm_lookup.MIN_VALID_BPM / 2.0
    result = bpm_lookup._normalize_bpm(too_low)
    assert result == pytest.approx(too_low * 2.0)


def test_normalize_bpm_user_band_prefers_band_center():
    # raw BPM is 60, but user band is 120–130; we allow integer multiples
    bpm = 60.0
    user_min, user_max = 120.0, 130.0
    result = bpm_lookup._normalize_bpm(bpm, user_min, user_max)
    # 60/2 = 30, 60, 120 → 120 is in band and closest to center 125
    assert result == pytest.approx(120.0)


def test_normalize_bpm_outside_after_adjustment_returns_none():
    # extremely high BPM that stays > MAX after halving once
    bpm = bpm_lookup.MAX_VALID_BPM * 10
    result = bpm_lookup._normalize_bpm(bpm)
    assert result is None


# ---------- cache helpers ----------

def test_cache_set_and_get(tmp_path, monkeypatch):
    monkeypatch.setenv("BPM_CACHE_PATH", str(tmp_path / "cache.json"))

    key = "isrc:TEST"
    bpm_lookup._cache_set(key, 123.4)
    cached = bpm_lookup._cache_get(key)
    assert cached == pytest.approx(123.4)


def test_cache_expired_returns_none(tmp_path, monkeypatch):
    monkeypatch.setenv("BPM_CACHE_PATH", str(tmp_path / "cache.json"))

    key = "isrc:OLD"
    now = time.time() - (bpm_lookup.CACHE_MAX_AGE_DAYS + 1) * 86400
    bpm_lookup._cache[key] = {"bpm": 100.0, "_ts": now}
    result = bpm_lookup._cache_get(key)
    assert result is None


# ---------- _get_json ----------

def test_get_json_success(monkeypatch):
    class DummyResponse:
        status_code = 200
        def json(self):
            return {"ok": True}

    calls = []

    def fake_get(url, headers=None, params=None, timeout=None):
        calls.append((url, headers, params, timeout))
        return DummyResponse()

    monkeypatch.setattr(bpm_lookup.requests, "get", fake_get)

    data = bpm_lookup._get_json("http://example.com", params={"a": "b"})
    assert data == {"ok": True}
    assert len(calls) == 1


def test_get_json_retries_and_gives_up(monkeypatch):
    class DummyResponse:
        status_code = 500
        def json(self):
            return {"bad": True}

    def fake_get(url, headers=None, params=None, timeout=None):
        return DummyResponse()

    monkeypatch.setattr(bpm_lookup.requests, "get", fake_get)

    data = bpm_lookup._get_json("http://example.com")
    assert data is None


# ---------- provider helpers ----------

def test_deezer_bpm_by_isrc_success(monkeypatch):
    def fake_get_json(url, headers=None, params=None):
        assert "isrc:TEST" in url
        return {"bpm": 128}

    monkeypatch.setattr(bpm_lookup, "_get_json", fake_get_json)

    result = bpm_lookup._deezer_bpm_by_isrc("TEST")
    assert result == pytest.approx(128.0)


def test_deezer_bpm_by_isrc_error(monkeypatch):
    def fake_get_json(url, headers=None, params=None):
        return {"error": {"message": "not found"}}

    monkeypatch.setattr(bpm_lookup, "_get_json", fake_get_json)

    result = bpm_lookup._deezer_bpm_by_isrc("TEST")
    assert result is None


def test_getsongbpm_by_isrc_success(monkeypatch):
    monkeypatch.setenv("GETSONGBPM_API_KEY", "dummy")

    def fake_get_json(url, headers=None, params=None):
        assert params["isrc"] == "TEST"
        return {"search": [{"tempo": "140.5"}]}

    monkeypatch.setattr(bpm_lookup, "_get_json", fake_get_json)

    result = bpm_lookup._getsongbpm_by_isrc("TEST")
    assert result == pytest.approx(140.5)


def test_getsongbpm_by_search_success(monkeypatch):
    monkeypatch.setenv("GETSONGBPM_API_KEY", "dummy")

    def fake_get_json(url, headers=None, params=None):
        assert "lookup" in params
        assert params["type"] == "both"
        return {"search": [{"tempo": "99"}]}

    monkeypatch.setattr(bpm_lookup, "_get_json", fake_get_json)

    result = bpm_lookup._getsongbpm_by_search("Artist", "Title")
    assert result == pytest.approx(99.0)


# ---------- bpm_from_isrc (integration of helpers + cache + normalize) ----------

def test_bpm_from_isrc_uses_cache_first(monkeypatch):
    key = "isrc:CACHED"
    bpm_lookup._cache_set(key, 150.0)

    # even if underlying providers would fail, we expect cached normalized result
    def fail_provider(*args, **kwargs):
        raise AssertionError("Should not be called when cached")

    monkeypatch.setattr(bpm_lookup, "_deezer_bpm_by_isrc", fail_provider)
    monkeypatch.setattr(bpm_lookup, "_getsongbpm_by_isrc", fail_provider)
    monkeypatch.setattr(bpm_lookup, "_getsongbpm_by_search", fail_provider)

    result = bpm_lookup.bpm_from_isrc("CACHED")
    assert result == pytest.approx(150.0)


def test_bpm_from_isrc_tries_providers_in_order(monkeypatch):
    calls = []

    def deezer(isrc):
        calls.append("deezer")
        return None

    def getsong_isrc(isrc):
        calls.append("getsong_isrc")
        return None

    def getsong_search(artist, title):
        calls.append("getsong_search")
        return 180.0

    monkeypatch.setattr(bpm_lookup, "_deezer_bpm_by_isrc", deezer)
    monkeypatch.setattr(bpm_lookup, "_getsongbpm_by_isrc", getsong_isrc)
    monkeypatch.setattr(bpm_lookup, "_getsongbpm_by_search", getsong_search)

    result = bpm_lookup.bpm_from_isrc(
        "NEW",
        fallback_title="Song",
        fallback_artist="Artist",
        user_min_bpm=170,
        user_max_bpm=190,
    )
    assert result == pytest.approx(180.0)
    assert calls == ["deezer", "getsong_isrc", "getsong_search"]


def test_bpm_from_isrc_returns_none_if_all_fail(monkeypatch):
    monkeypatch.setattr(bpm_lookup, "_deezer_bpm_by_isrc", lambda isrc: None)
    monkeypatch.setattr(bpm_lookup, "_getsongbpm_by_isrc", lambda isrc: None)
    monkeypatch.setattr(bpm_lookup, "_getsongbpm_by_search", lambda a, t: None)

    result = bpm_lookup.bpm_from_isrc("FAIL")
    assert result is None
