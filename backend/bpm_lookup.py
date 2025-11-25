import os
import json
import time
from typing import Optional, Dict, Any
import requests

USE_DEEZER = True
USE_GETSONGBPM_ISRC = True
USE_GETSONGBPM_SEARCH = True

GETSONGBPM_API_KEY = os.getenv("GETSONGBPM_API_KEY", "").strip()

CACHE_PATH = os.getenv("BPM_CACHE_PATH", "bpm_cache.json")
CACHE_MAX_AGE_DAYS = 90

REQUEST_TIMEOUT = 10
RETRY_COUNT = 2
RETRY_SLEEP = 0.5

MIN_VALID_BPM = 40.0
MAX_VALID_BPM = 240.0

_cache: Dict[str, Any] = {}

def _load_cache():
    global _cache
    if _cache:
        return
    try:
        with open(CACHE_PATH, "r", encoding="utf-8") as f:
            _cache = json.load(f)
    except Exception:
        _cache = {}

def _save_cache():
    try:
        with open(CACHE_PATH, "w", encoding="utf-8") as f:
            json.dump(_cache, f, ensure_ascii=False, indent=2)
    except Exception:
        pass

def _cache_get(key: str) -> Optional[float]:
    _load_cache()
    hit = _cache.get(key)
    if not hit:
        return None
    # simple age check
    ts = hit.get("_ts", 0)
    if time.time() - ts > CACHE_MAX_AGE_DAYS * 86400:
        return None
    return hit.get("bpm")

def _cache_set(key: str, bpm: float):
    _load_cache()
    _cache[key] = {"bpm": bpm, "_ts": time.time()}
    _save_cache()

def _get_json(url: str, headers: Dict[str,str] = None, params: Dict[str,str] = None) -> Optional[dict]:
    for _ in range(RETRY_COUNT + 1):
        try:
            r = requests.get(url, headers=headers, params=params, timeout=REQUEST_TIMEOUT)
            if r.status_code == 200:
                return r.json()
        except Exception:
            pass
        time.sleep(RETRY_SLEEP)
    return None

def _normalize_bpm(bpm: float, user_min: Optional[float] = None, user_max: Optional[float] = None) -> Optional[float]:
    if bpm is None or bpm <= 0:
        return None
    if bpm < MIN_VALID_BPM or bpm > MAX_VALID_BPM:
        if bpm > MAX_VALID_BPM:
            bpm = bpm / 2.0
        elif bpm < MIN_VALID_BPM:
            bpm = bpm * 2.0

    if user_min is not None and user_max is not None:
        candidates = [bpm / 2.0, bpm, bpm * 2.0]
        in_band = [x for x in candidates if user_min <= x <= user_max]
        if in_band:
            center = (user_min + user_max) / 2.0
            in_band.sort(key=lambda x: abs(x - center))
            return in_band[0]
    if MIN_VALID_BPM <= bpm <= MAX_VALID_BPM:
        return bpm
    return None

def _deezer_bpm_by_isrc(isrc: str) -> Optional[float]:
    url = f"https://api.deezer.com/track/isrc:{isrc}"
    data = _get_json(url)
    if not data or "error" in data:
        return None
    bpm = data.get("bpm")
    try:
        return float(bpm) if bpm is not None else None
    except Exception:
        return None

def _getsongbpm_by_isrc(isrc: str) -> Optional[float]:
    if not GETSONGBPM_API_KEY:
        return None
    url = "https://api.getsongbpm.com/search/"
    data = _get_json(url, params={"api_key": GETSONGBPM_API_KEY, "isrc": isrc})
    if not data:
        return None
    arr = data.get("search") or []
    for item in arr:
        tempo = item.get("tempo")
        try:
            val = float(tempo)
            if val > 0:
                return val
        except Exception:
            continue
    return None

def _getsongbpm_by_search(artist: str, title: str) -> Optional[float]:
    if not GETSONGBPM_API_KEY:
        return None
    url = "https://api.getsongbpm.com/search/"
    q = f"{artist} {title}".strip()
    data = _get_json(url, params={"api_key": GETSONGBPM_API_KEY, "type": "both", "lookup": q})
    if not data:
        return None
    arr = data.get("search") or []
    for item in arr:
        tempo = item.get("tempo")
        try:
            val = float(tempo)
            if val > 0:
                return val
        except Exception:
            continue
    return None

def bpm_from_isrc(
    isrc: str,
    *,
    fallback_title: Optional[str] = None,
    fallback_artist: Optional[str] = None,
    user_min_bpm: Optional[float] = None,
    user_max_bpm: Optional[float] = None,
) -> Optional[float]:
    key = f"isrc:{isrc}"
    cached = _cache_get(key)
    if cached is not None:
        return _normalize_bpm(cached, user_min_bpm, user_max_bpm)

    bpm: Optional[float] = None

    if USE_DEEZER and not bpm:
        bpm = _deezer_bpm_by_isrc(isrc)

    if USE_GETSONGBPM_ISRC and not bpm:
        bpm = _getsongbpm_by_isrc(isrc)

    if USE_GETSONGBPM_SEARCH and not bpm and fallback_title and fallback_artist:
        bpm = _getsongbpm_by_search(fallback_artist, fallback_title)

    if bpm is None:
        return None

    bpm_norm = _normalize_bpm(bpm, user_min_bpm, user_max_bpm)
    if bpm_norm is None:
        return None

    _cache_set(key, bpm_norm)
    return bpm_norm
