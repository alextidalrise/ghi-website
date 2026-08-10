#!/usr/bin/env python3
import base64
import hashlib
import json
import zlib
from pathlib import Path

root = Path(__file__).resolve().parents[1]
paths = {
    "template_html": root / "build_production" / "component-library-v1.html",
    "campaign_html": root / "build_production" / "portugal-v15.html",
    "campaign_text": root / "build_production" / "portugal-v15.txt",
}
raw = {name: path.read_bytes() for name, path in paths.items()}
payloads = {
    "template": {"html": raw["template_html"].decode("utf-8")},
    "campaign": {
        "html": raw["campaign_html"].decode("utf-8"),
        "plain_text": raw["campaign_text"].decode("utf-8"),
    },
    "combined": {
        "template_html": raw["template_html"].decode("utf-8"),
        "campaign_html": raw["campaign_html"].decode("utf-8"),
        "campaign_text": raw["campaign_text"].decode("utf-8"),
    },
}
blob_values = {
    name: base64.b64encode(zlib.compress(json.dumps(value).encode("utf-8"), 9)).decode("ascii")
    for name, value in payloads.items()
}
out = {
    "sha256": {name: hashlib.sha256(data).hexdigest() for name, data in raw.items()},
    "bytes": {name: len(data) for name, data in raw.items()},
    "blobs": blob_values,
}
(root / "qa" / "mailchimp-payload.json").write_text(json.dumps(out, indent=2), encoding="utf-8")
chunks = {name: [value[i:i + 3000] for i in range(0, len(value), 3000)] for name, value in blob_values.items()}
(root / "qa" / "mailchimp-payload-chunks.json").write_text(json.dumps(chunks, indent=2), encoding="utf-8")
chunk_dir = root / "qa" / "mailchimp-combined-chunks"
chunk_dir.mkdir(parents=True, exist_ok=True)
for index, chunk in enumerate(chunks["combined"], start=1):
    wrapped = "\n".join(chunk[i:i + 500] for i in range(0, len(chunk), 500)) + "\n"
    (chunk_dir / f"chunk-{index:02d}.txt").write_text(wrapped, encoding="ascii")
print(json.dumps({"sha256": out["sha256"], "bytes": out["bytes"], "blob_chars": {k: len(v) for k, v in out["blobs"].items()}, "chunk_counts": {k: len(v) for k, v in chunks.items()}}, indent=2))
