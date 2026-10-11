#!/usr/bin/env python3
"""Apply fact-check corrections (/tmp/bc_people/check_out_*.json) to source/people/people.json and log them."""
import json, glob, os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
p = os.path.join(ROOT, "source/people/people.json"); d = json.load(open(p))
by = {r["id"]: r for r in d["people"]}
log = []; n = 0
for f in sorted(glob.glob("/tmp/bc_people/check_out_*.json")):
    for pid, c in json.load(open(f)).items():
        r = by.get(pid)
        if not r: continue
        for k in ("bio", "role", "moments"):
            if k in c and c[k] is not None: r[k] = c[k]
        r["checked"] = True; n += 1
        log.append(f"\n## {r['name']} (`{pid}`)\n" + "".join(f"- {x}\n" for x in c.get("changes", [])))
for f in sorted(glob.glob("/tmp/bc_people/check_*.txt")):
    for pid in open(f).read().split():
        if pid in by: by[pid]["checked"] = True
json.dump(d, open(p, "w"), ensure_ascii=False, indent=1)
open(os.path.join(ROOT, "source/people/fact-check-log.md"), "w").write("# People bios: fact-check corrections\n\nAn independent pass checked each bio against the full transcribed items.\n" + "".join(log))
print("corrected", n, "checked", sum(1 for r in d["people"] if r.get("checked")))
