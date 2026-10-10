#!/usr/bin/env python3
"""Page-image helper for transcription (uses the LOC IIIF image server).

  crop.py thumb  DATE PAGE              whole page, ~1400px tall (layout view)
  crop.py region DATE PAGE X Y W H      region in % of page, full resolution,
                                        auto-split into slices <= ~850px tall
Prints the jpg paths written under /tmp/bc_crops/.
"""
import json, os, sys, subprocess, math
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "source", "ocr")
OUT = "/tmp/bc_crops"; os.makedirs(OUT, exist_ok=True)

def ok(fn):
    if not os.path.exists(fn) or os.path.getsize(fn) < 1000: return False
    with open(fn, "rb") as f:
        f.seek(-2, 2); return f.read() == b"\xff\xd9"     # complete JPEG

def fetch(url, fn):
    for attempt in range(6):
        if ok(fn): break
        tmp = fn + ".part"
        subprocess.run(["curl", "-sS", "--fail", "--retry", "3", "-m", "120", "-o", tmp, url])
        if ok(tmp): os.replace(tmp, fn)
    if not ok(fn): sys.exit(f"FAILED to download a complete image: {url}")
    print(fn)

mode, date, page = sys.argv[1], sys.argv[2], int(sys.argv[3])
man = json.load(open(os.path.join(ROOT, date, "manifest.json")))
iiif = next(p for p in man["pages"] if p["seq"] == page)["iiif"]
if mode == "thumb":
    fetch(f"{iiif}/full/!1400,1400/0/default.jpg", f"{OUT}/{date}_p{page}_thumb.jpg")
else:
    x, y, w, h = map(float, sys.argv[4:8])
    n = max(1, math.ceil(h / 13.5))          # ~6200px page -> 13.5% ~ 840px
    for k in range(n):
        yy = y + h * k / n; hh = h / n + 0.6
        fetch(f"{iiif}/pct:{x:.2f},{yy:.2f},{w:.2f},{hh:.2f}/full/0/default.jpg",
              f"{OUT}/{date}_p{page}_{x:.0f}-{yy:.1f}_{w:.0f}x{hh:.1f}.jpg")
