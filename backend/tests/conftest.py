# backend/tests/conftest.py
import sys
from pathlib import Path

# Resolve the project root where api.py, main.py, bpm_lookup.py live:
# tests/ -> parent = backend/
ROOT = Path(__file__).resolve().parents[1]

# Put backend/ at the front of sys.path so `import api`, `import main`, etc. work.
sys.path.insert(0, str(ROOT))
