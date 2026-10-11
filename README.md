# Moderation coding browser

Static page for collaborators to inspect pre-ML and post-ML SOI moderation coding.
Use the left sidebar to switch phases.

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

analysis = Path("../../human-ai-theory-building/survey-analysis/textual_analysis/moderation_analysis")
# If this browser repo sits next to human-ai-theory-building, adjust as needed:
if not analysis.exists():
    analysis = Path("../human-ai-theory-building/survey-analysis/textual_analysis/moderation_analysis")

dst = Path("data.json")

def slim_phase(path, extra_meta=()):
    data = json.loads(path.read_text(encoding="utf-8"))
    out = {
        "model": data.get("model"),
        "reasoning_effort": data.get("reasoning_effort"),
        "records": [
            {
                "participant_id": r["participant_id"],
                "group_code": r["group_code"],
                "task": r["task"],
                "research_domain": r["research_domain"],
                "theory_text": r["theory_text"],
                "coding": r["coding"],
            }
            for r in data["records"]
            if r.get("coding") is not None
        ],
    }
    for key in extra_meta:
        if key in data:
            out[key] = data[key]
    return out

payload = {
    "pre": slim_phase(analysis / "moderation_coding_pre_ML.json"),
    "post": slim_phase(
        analysis / "moderation_coding_post_ML.json",
        extra_meta=("coding_schema",),
    ),
}
dst.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print("pre", len(payload["pre"]["records"]), "post", len(payload["post"]["records"]), "->", dst)
PY
```
