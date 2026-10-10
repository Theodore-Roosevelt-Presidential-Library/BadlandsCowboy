#!/usr/bin/env python3
"""From ALTO: write p<n>.blocks.json (block id, region as % of page, OCR text)
and p<n>.num.txt (OCR text with [block-id] markers) for every page."""
import json, os, glob, xml.etree.ElementTree as ET
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "source", "ocr")
for ap in sorted(glob.glob(os.path.join(ROOT, "*", "p*.alto.xml"))):
    seq = os.path.basename(ap).split(".")[0][1:]
    root = ET.parse(ap).getroot(); ns = root.tag.split("}")[0] + "}"
    page = next(root.iter(ns + "Page")); W, H = float(page.get("WIDTH")), float(page.get("HEIGHT"))
    out, txt = [], []
    for i, tb in enumerate(root.iter(ns + "TextBlock"), 1):
        lines = [" ".join(s.get("CONTENT", "") for s in tl.iter(ns + "String")) for tl in tb.iter(ns + "TextLine")]
        lines = [l for l in lines if l.strip()]
        if not lines: continue
        bid = f"p{seq}b{i}"
        x, y, w, h = (float(tb.get(k)) for k in ("HPOS", "VPOS", "WIDTH", "HEIGHT"))
        out.append({"id": bid, "x": round(x / W * 100, 3), "y": round(y / H * 100, 3),
                    "w": round(w / W * 100, 3), "h": round(h / H * 100, 3), "text": "\n".join(lines)})
        txt.append(f"[{bid}]\n" + "\n".join(lines))
    d = os.path.dirname(ap)
    json.dump(out, open(os.path.join(d, f"p{seq}.blocks.json"), "w"))
    open(os.path.join(d, f"p{seq}.num.txt"), "w").write("\n\n".join(txt))
print("ok")
