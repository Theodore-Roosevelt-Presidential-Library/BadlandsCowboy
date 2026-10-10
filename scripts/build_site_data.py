#!/usr/bin/env python3
"""Compile data/issues/*.json (one AI-assisted transcription per issue) into the
static data files the site reads from site/data/.

Normalizes a few things the per-issue transcriptions did inconsistently:
  * standing brand-ad "events" (e.g. the weekly Chimney Butte Ranch card) are
    dropped from the timeline; brands live in the Brands & Businesses directory
  * tr = True only when Roosevelt himself is named; tr_related flags items about
    his ranches and partners (Maltese Cross, Elkhorn, Ferris, Merrifield, Sewall, Dow)
"""
import json, glob, os, re, csv, collections, datetime

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
OUT = os.path.join(ROOT, "data")
os.makedirs(os.path.join(OUT, "issues"), exist_ok=True)

TR_NAME = re.compile(r"\b(Theodore|Theo\.?|T\.)\s*R[ou]?o?s[e]?velt|Roosevelt|Rosevelt|Rousevelt|Teeodore", re.I)
TR_REL = re.compile(r"Maltese|Elk ?horn|Chimney Butte|Ferris|Merrifield|Sewall|Seawall|Sewell|Wilmot Dow|\bDow\b", re.I)
MORES = re.compile(r"Mor[eè]s|Marquis|Marquise|Refrigerator Car", re.I)

def text_of(e):
    return " ".join([e.get("title") or "", e.get("summary") or "", e.get("excerpt") or "", " ".join(e.get("people") or [])])

def norm_name(s):
    s = re.sub(r"\[.*?\]", "", s)
    s = re.sub(r"[^A-Za-z0-9& ]", " ", s).lower()
    s = re.sub(r"\b(the|co|company|ranch|ranche|cattle)\b", " ", s)
    return re.sub(r"\s+", " ", s).strip()

issues, events, search = [], [], []
brands, biz = {}, {}
for f in sorted(glob.glob(os.path.join(ROOT, "source", "transcriptions", "*.json"))):
    j = json.load(open(f))
    d = j["date"]
    man = json.load(open(os.path.join(ROOT, "source", "ocr", d, "manifest.json")))
    pages = []
    notes = {p.get("seq"): p for p in j.get("pages", [])}
    for p in man["pages"]:
        n = notes.get(p["seq"], {})
        pages.append({"seq": p["seq"], "iiif": p["iiif"], "kind": n.get("kind"), "notes": n.get("notes")})
    arts = {a["id"]: a for a in j["articles"]}
    out_articles = []
    for a in j["articles"]:
        out_articles.append({k: a.get(k) for k in ("id", "page", "cols", "region", "section", "headline", "text", "summary", "people", "method", "confidence")})
        t = a.get("text") or ""
        if a.get("section") == "advertising":
            for line in t.split("\n"):
                line = line.strip(" -•")
                if not line: continue
                isbrand = line.lower().startswith("brand")
                body = re.sub(r"^brands?\s*:\s*", "", line, flags=re.I)
                m = re.match(r"^([^,—]+,\s*[^,—]*&\s*Co\.?)", body)
                name = (m.group(1) if m else re.split(r"\s+—\s+|,|;", body)[0]).strip()
                name = re.sub(r"\s*\(.*?(\)|$)|\s*\[.*?(\]|$)", "", name).strip(" ,;")
                if not name or name.startswith("("): continue
                key = norm_name(name)
                if len(key) < 3: continue
                tgt = brands if isbrand else biz
                r = tgt.setdefault(key, {"name": name, "first": d, "last": d, "n": 0, "text": body, "issue": d})
                r["n"] += 1; r["last"] = max(r["last"], d); r["first"] = min(r["first"], d)
                if d >= r["issue"]: r["text"], r["issue"], r["name"] = body, d, name
        elif t and a.get("section") not in ("ready-print", "masthead"):
            search.append([d, a["id"], a.get("headline") or "", t])
    tr_n = 0
    for e in j["events"]:
        a = arts.get(e.get("article"), {})
        tt = text_of(e)
        if a.get("section") == "advertising" and ("brand" in tt.lower() or "brands" in (e.get("tags") or [])):
            continue                          # standing brand cards -> directory, not timeline
        src = (a.get("text") or "") + " " + (e.get("excerpt") or "")
        tr = bool(TR_NAME.search(tt)) and bool(TR_NAME.search(src))   # must be named in the printed text
        if tr and re.search(r"George W\.? Roosevelt|consul", tt, re.I): tr = False
        rel = (not tr) and bool(TR_REL.search(tt) or e.get("tr"))
        tags = sorted(set((e.get("tags") or [])) - {"tr", "mores"})
        if tr: tags.append("tr")
        tt_m = re.sub(r"Hotel\s+de\s+Mor[eè]s|De\s*Mor[eè]s\s+cigar", "", tt, flags=re.I)   # named after him, not about him
        mores = bool(MORES.search(tt_m))
        if mores: tags.append("mores")
        tr_n += tr
        events.append({
            "id": f"{d}-{e['id']}", "date": e["date"], "end": e.get("date_end"), "prec": e.get("date_precision"),
            "planned": bool(e.get("planned")), "basis": e.get("date_basis"), "title": e["title"],
            "summary": e.get("summary"), "excerpt": e.get("excerpt"), "people": e.get("people") or [],
            "places": e.get("places") or [], "tags": tags, "tr": tr, "trRel": rel, "mores": mores,
            "conf": e.get("confidence"), "issue": d, "article": e.get("article"),
            "page": a.get("page"), "region": a.get("region")})
    vol = j.get("volume")
    rec = {"date": d, "masthead": j.get("masthead"), "volume": vol, "pages": pages,
           "articles": out_articles, "review": j.get("review_needed")}
    json.dump(rec, open(os.path.join(OUT, "issues", d + ".json"), "w"), ensure_ascii=False, separators=(",", ":"))
    ev_titles = [e["title"] for e in j["events"] if not (arts.get(e.get("article"), {}).get("section") == "advertising")]
    issues.append({"date": d, "volume": vol, "nPages": len(pages), "thumb": pages[0]["iiif"],
                   "nArticles": sum(1 for a in j["articles"] if a.get("text") and a.get("section") not in ("advertising", "ready-print", "masthead")),
                   "nEvents": len(ev_titles), "tr": tr_n, "top": ev_titles[:3], "review": bool(j.get("review_needed"))})

events.sort(key=lambda e: (e["date"], e["issue"], e["id"]))

# merge repeats: the paper re-ran notices for weeks; same date + similar title = one event
STOP = set("the a an of to and in for at on by with from is his her their as cow boy medora".split())
def toks(t): return set(w for w in re.findall(r"[a-z]+", t.lower()) if w not in STOP and len(w) > 2)
merged, byday = [], collections.defaultdict(list)
for e in events:
    tk = toks(e["title"] + " " + (e["summary"] or ""))
    dup = None
    for m in byday[e["date"]]:
        mk = m["_tk"]
        if tk and mk and len(tk & mk) / len(tk | mk) >= 0.45: dup = m; break
    if dup:
        dup.setdefault("also", []).append(e["issue"])
        dup["tr"] = dup["tr"] or e["tr"]; dup["mores"] = dup["mores"] or e["mores"]
        dup["tags"] = sorted(set(dup["tags"]) | set(e["tags"]))
        continue
    e["_tk"] = tk; byday[e["date"]].append(e); merged.append(e)
for e in merged:
    e.pop("_tk", None)
    if "also" in e: e["also"] = sorted(set(e["also"]) - {e["issue"]})
events = merged
json.dump(events, open(os.path.join(OUT, "events.json"), "w"), ensure_ascii=False, separators=(",", ":"))
json.dump(issues, open(os.path.join(OUT, "issues.json"), "w"), ensure_ascii=False, separators=(",", ":"))
json.dump(search, open(os.path.join(OUT, "search.json"), "w"), ensure_ascii=False, separators=(",", ":"))
def dirlist(dct):
    return sorted(({"name": v["name"], "text": v["text"], "first": v["first"], "last": v["last"], "n": v["n"], "issue": v["issue"]}
                   for v in dct.values() if v["n"] >= 1 and not v["name"].rstrip().endswith("&")), key=lambda r: r["name"].lower())
json.dump({"brands": dirlist(brands), "businesses": dirlist(biz)}, open(os.path.join(OUT, "directory.json"), "w"), ensure_ascii=False, separators=(",", ":"))

with open(os.path.join(OUT, "events.csv"), "w", newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["id", "date", "date_end", "precision", "planned", "title", "summary", "excerpt", "people", "places", "tags",
                "theodore_roosevelt", "roosevelt_related", "mores", "confidence", "issue_date", "loc_issue_url", "page"])
    for e in events:
        w.writerow([e["id"], e["date"], e["end"] or "", e["prec"], e["planned"], e["title"], e["summary"], e["excerpt"],
                    "; ".join(e["people"]), "; ".join(e["places"]), " ".join(e["tags"]), e["tr"], e["trRel"], e["mores"],
                    e["conf"], e["issue"], f"https://www.loc.gov/item/sn84024777/{e['issue']}/ed-1/", e["page"]])

meta = {"built": datetime.date.today().isoformat(), "issues": len(issues), "events": len(events),
        "tr": sum(e["tr"] for e in events), "articles": len(search),
        "words": sum(len(s[3].split()) for s in search),
        "missing": ["1884-09-11", "1885-10-08", "1885-11-05", "1885-11-12", "1885-12-10", "1886-01-07", "1886-03-04",
                    "1886-04-08", "1886-04-22", "1886-04-29", "1886-05-20", "1886-05-27", "1886-06-03", "1886-06-24",
                    "1886-07-29", "1886-08-05", "1886-08-12", "1886-09-16", "1886-09-30", "1886-12-02"]}
json.dump(meta, open(os.path.join(OUT, "meta.json"), "w"), indent=1)
print(meta, len(brands), len(biz))

# ---------- ad gallery (source/ads/ads.json, cataloged from first appearance) ----------
ads_src = os.path.join(ROOT, "source", "ads", "ads.json")
if os.path.exists(ads_src):
    ads = json.load(open(ads_src))
    adtext = {}   # issue -> lowercase advertising text, for counting how long each ad ran
    for f in sorted(glob.glob(os.path.join(ROOT, "source", "transcriptions", "*.json"))):
        j = json.load(open(f))
        adtext[j["date"]] = norm_name(" ".join(a.get("text") or "" for a in j["articles"] if a.get("section") == "advertising"))
    GENERIC = {"for", "sale", "lots", "medora", "insurance", "groceries", "notice", "wanted", "general", "store", "dak", "brand"}
    for a in ads:
        words = [w for w in norm_name(a["advertiser"]).split() if len(w) > 2 and w not in GENERIC][:3]
        key = " ".join(words)
        runs = sorted(d for d, t in adtext.items() if key and key in t and d >= a["issue"]) if key else []
        a["runs"] = len(runs) or 1
        a["last"] = runs[-1] if runs else a["issue"]
        man = json.load(open(os.path.join(ROOT, "source", "ocr", a["issue"], "manifest.json")))
        a["iiif"] = next(p["iiif"] for p in man["pages"] if p["seq"] == a["page"])
    json.dump([{k: a.get(k) for k in ("id", "advertiser", "aka", "issue", "page", "box", "kind", "category", "town", "local", "text",
                                      "sells", "pitch", "prices", "illustrated", "notes", "confidence", "runs", "last", "iiif")} for a in ads],
              open(os.path.join(OUT, "ads.json"), "w"), ensure_ascii=False, separators=(",", ":"))
    print("ads", len(ads))
