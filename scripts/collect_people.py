#!/usr/bin/env python3
"""Collect every person-name string the transcriptions tag, with mention contexts,
for the people-matching pass. Writes /tmp/bc_people/names.json and shard files."""
import json, glob, os, re, collections, unicodedata
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SKIP = {"advertising", "ready-print", "masthead"}
ment = collections.defaultdict(list)   # name -> [(issue, aid, headline, snippet)]
evn = collections.Counter()
def strip(s): return unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode()
for f in sorted(glob.glob(os.path.join(ROOT, "source/transcriptions/*.json"))):
    j = json.load(open(f)); d = j["date"]
    arts = {a["id"]: a for a in j["articles"]}
    seen = set()
    for a in j["articles"]:
        if a.get("section") in SKIP: continue
        for p in a.get("people") or []:
            p = p.strip()
            if not p or (p, a["id"]) in seen: continue
            seen.add((p, a["id"]))
            ment[p].append((d, a["id"], a.get("headline") or "", (a.get("summary") or "")[:160]))
    for e in j["events"]:
        a = arts.get(e.get("article"), {})
        if a.get("section") in SKIP: continue
        for p in e.get("people") or []:
            p = p.strip()
            evn[p] += 1
            if p and (p, e.get("article")) not in seen and e.get("article"):
                seen.add((p, e["article"]))
                ment[p].append((d, e["article"], a.get("headline") or "", (e.get("summary") or "")[:160]))
def last(n):
    n = re.sub(r"\(.*?\)|\[.*?\]", "", n).strip(" .,")
    t = [w for w in re.split(r"\s+", strip(n)) if w]
    if not t: return "?"
    w = t[-1].strip(".,'").lower()
    if w in ("jr", "sr", "esq", "md", "m.d") and len(t) > 1: w = t[-2].lower()
    return w
names = []
for n, ms in ment.items():
    ms.sort()
    names.append({"name": n, "n": len(ms), "first": ms[0][0], "last": ms[-1][0], "key": last(n),
                  "ctx": [f"{m[0]} {m[3]}" for m in ms[:3]]})
names.sort(key=lambda r: (r["key"], r["name"]))
json.dump({k: v for k, v in ment.items()}, open("/tmp/bc_people/mentions.json", "w"))
json.dump(names, open("/tmp/bc_people/names.json", "w"), indent=0)
# shard by surname so variants land together
shards = [("a", "c"), ("d", "g"), ("h", "l"), ("m", "o"), ("p", "r"), ("s", "z")]
for lo, hi in shards:
    part = [r for r in names if (lo <= r["key"][:1] <= hi) or (lo == "a" and not r["key"][:1].isalpha())]
    with open(f"/tmp/bc_people/shard_{lo}-{hi}.txt", "w") as fh:
        for r in part:
            fh.write(f"{r['name']}\t{r['n']}\t{r['first']}..{r['last']}\t" + " | ".join(r["ctx"]) + "\n")
    print(lo, hi, len(part))
print(len(names), sum(r["n"] for r in names))
