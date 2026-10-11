#!/usr/bin/env python3
"""Turn the matched people (/tmp/bc_people/out_*.json) into source/people/people.json
(id, name, aliases, role, group...) and write bio-writing shards with mention excerpts."""
import json, glob, os, re, unicodedata, collections
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
P = []; NP = []
for f in sorted(glob.glob("/tmp/bc_people/out_*.json")):
    j = json.load(open(f)); P += j["people"]; NP += j["not_people"]
def byname(n): return next(p for p in P if p["name"] == n)
def merge(keep, drop):
    k, d = byname(keep), byname(drop)
    k["aliases"] = sorted(set(k["aliases"]) | set(d["aliases"]))
    k["note"] = (k.get("note") or "") + f" Merged with '{drop}' across shards."
    P.remove(d)
merge("W. F. Van Driesche", "William F. VanDriesche")
merge("J. A. VanEeghen", "J. A. Van Eeghen")
merge("Julius LeMoyne", "Julius Le Moyne")
merge("W. A. Van Brunt", "W. A. VanBrunt")
vd = byname("W. F. Van Driesche"); vd["aliases"].remove("William")
vd["role"] = "Medora banker and storekeeper with the Marquis's enterprises; treasurer of the Medora Stage and Forwarding Co."
P.append({"name": "William", "aliases": ["William"], "role": None, "group": "other", "notable": False, "ambiguous": True, "note": "bare first name"})
def slug(s):
    s = unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")
used = set()
for p in P:
    b = slug(p["name"]) or "person"; s = b; i = 2
    while s in used: s = f"{b}-{i}"; i += 1
    used.add(s); p["id"] = s
ment = json.load(open("/tmp/bc_people/mentions.json"))
# Roosevelt: also every item behind an event the site flags as naming TR
ev = json.load(open(os.path.join(ROOT, "data/events.json")))
tr = byname("Theodore Roosevelt")
for p in P:
    seen = {}
    for a in p["aliases"]:
        for d, aid, h, s in ment.get(a, []): seen[(d, aid)] = (h, s)
    if p is tr:
        for e in ev:
            if e["tr"] and e.get("article"): seen.setdefault((e["issue"], e["article"]), ("", e.get("summary") or ""))
    p["mentions"] = sorted(seen)
    p["n"] = len(p["mentions"])
P.sort(key=lambda p: (-p["n"], p["name"]))
os.makedirs(os.path.join(ROOT, "source/people"), exist_ok=True)
json.dump({"people": P, "not_people": NP}, open(os.path.join(ROOT, "source/people/matched.json"), "w"), ensure_ascii=False, indent=1)
print(len(P), "people;", sum(p["n"] >= 3 for p in P), "with 3+ items")

# ---- bio shards: excerpts around each mention ----
texts = {}
for f in glob.glob(os.path.join(ROOT, "source/transcriptions/*.json")):
    j = json.load(open(f))
    for a in j["articles"]: texts[(j["date"], a["id"])] = (a.get("headline") or "", a.get("text") or a.get("summary") or "")
STOPW = {"mr", "mrs", "miss", "dr", "judge", "col", "capt", "gen", "rev", "hon", "father", "major", "the", "de", "van", "jr", "sr"}
def keys(p):
    k = set()
    for a in p["aliases"]:
        for w in re.findall(r"[A-Za-zÀ-ÿ']{3,}", a):
            if w.lower() not in STOPW: k.add(w)
    return k
def excerpt(text, ks, lim=420):
    sents = re.split(r"(?<=[.!?])\s+", text.replace("\n", " "))
    hit = [i for i, s in enumerate(sents) if any(re.search(r"\b" + re.escape(k) + r"\b", s, re.I) for k in ks)]
    if not hit: return text[:lim]
    i = hit[0]; out = " ".join(sents[max(0, i - 1): i + 2])
    return out[:lim]
bio = [p for p in P if p["n"] >= 3]
lines = {}
for p in bio:
    ks = keys(p)
    ms = p["mentions"]
    if len(ms) > 30:   # spread evenly through time
        step = len(ms) / 30; ms = [ms[int(i * step)] for i in range(30)]
    body = [f"## {p['id']}\nname: {p['name']}\naliases: {'; '.join(p['aliases'])}\nmatched role: {p.get('role')}\ngroup: {p['group']}\nitems: {p['n']} ({p['mentions'][0][0]} to {p['mentions'][-1][0]})"]
    for d, aid in ms:
        h, t = texts.get((d, aid), ("", ""))
        body.append(f"[{d}/{aid}] " + (h + ": " if h else "") + excerpt(t, ks))
    lines[p["id"]] = "\n".join(body) + "\n"
ids = [p["id"] for p in bio]
N = 6
chunks = [[] for _ in range(N)]; size = [0] * N
for i in ids:   # balance by text size
    k = size.index(min(size)); chunks[k].append(i); size[k] += len(lines[i])
for k, c in enumerate(chunks):
    with open(f"/tmp/bc_people/bio_in_{k}.txt", "w") as fh:
        for i in c: fh.write(lines[i] + "\n")
    print(k, len(c), size[k])
