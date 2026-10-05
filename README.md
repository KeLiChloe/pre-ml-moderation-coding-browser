# Pre-ML moderation coding browser

Static page for collaborators to inspect pre-ML SOI moderation coding.

## Local preview

From this folder:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000/`.

## GitHub Pages

1. Repo Settings → Pages
2. Source: Deploy from a branch
3. Branch: `main`, folder: `/ (root)`
4. Site URL will be:

`https://kelichloe.github.io/pre-ml-moderation-coding-browser/`

## Refresh data

After re-running coding:

```bash
python3 - <<'PY'
import json
from pathlib import Path
src = Path("../../survey-analysis/textual_analysis/moderation_analysis/moderation_coding_pre_ML.json")
dst = Path("data.json")
data = json.loads(src.read_text())
slim = {
    "model": data.get("model"),
    "reasoning_effort": data.get("reasoning_effort"),
    "records": [
        {
            "participant_id": r["participant_id"],
            "group_code": r["group_code"],
            "task": r["task"],
            "research_domain": r["research_domain"],
            "theory_text": r["theory_text"],
            "pairs_submitted": r["pairs_submitted"],
            "coding": r["coding"],
        }
        for r in data["records"]
    ],
}
dst.write_text(json.dumps(slim, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(len(slim["records"]), "records ->", dst)
PY
```
