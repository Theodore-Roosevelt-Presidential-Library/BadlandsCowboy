#!/usr/bin/env python3
"""Merge matched people + AI bios into source/people/people.json (the master file)
and write source/people/review.md listing the bio-writers' flags for a human pass."""
import json, glob, os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
M = json.load(open(os.path.join(ROOT, "source/people/matched.json")))
B = {}
for f in sorted(glob.glob("/tmp/bc_people/bio_out_*.json")): B.update(json.load(open(f)))
out, rev = [], ["# People: items for a human check\n", "Flags raised by the bio pass and the matching pass. Bios say only what the paper says; check flagged ones against the page.\n"]
for p in M["people"]:
    b = B.get(p["id"], {})
    rec = {k: p.get(k) for k in ("id", "name", "aliases", "group", "notable", "ambiguous")}
    rec["role"] = b.get("role", p.get("role"))
    rec["bio"] = b.get("bio")
    ments = set(map(tuple, p["mentions"]))
    rec["moments"] = [m for m in b.get("moments", []) if tuple(m["ref"].split("/")) in ments]
    rec["mentions"] = p["mentions"]
    rec["match_note"] = p.get("note") or ""
    out.append(rec)
    fl = b.get("flags") or []
    if fl or (p.get("note") and "unsure" in p.get("note", "").lower()):
        rev.append(f"\n## {p['name']} (`{p['id']}`, {len(p['mentions'])} items)\n")
        if p.get("note"): rev.append(f"- Matching: {p['note']}\n")
        for x in fl: rev.append(f"- {x}\n")
json.dump({"people": out, "not_people": M["not_people"]}, open(os.path.join(ROOT, "source/people/people.json"), "w"), ensure_ascii=False, indent=1)
open(os.path.join(ROOT, "source/people/review.md"), "w").write("".join(rev))
print(len(out), sum(1 for r in out if r["bio"]), sum(len(r["moments"]) for r in out))
