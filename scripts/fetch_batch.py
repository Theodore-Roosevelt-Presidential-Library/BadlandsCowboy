#!/usr/bin/env python3
"""Download every issue of The Bad Lands Cow Boy (LCCN sn84024777) straight from
the NDNP batch on tile.loc.gov: issue METS -> page list -> ALTO OCR text.

Output: data/raw/<date>/manifest.json and data/raw/<date>/p<n>.txt (raw OCR,
blocks separated by blank lines) and p<n>.alto.xml (kept for word coordinates).
"""
import json, os, re, time, urllib.request, xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor

LCCN = "sn84024777"
BASE = "https://tile.loc.gov/storage-services/service/ndnp/ndhi/batch_ndhi_jessie_ver01/data/"
IIIF = "https://tile.loc.gov/image-services/iiif/service:ndnp:ndhi:batch_ndhi_jessie_ver01:data:"
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "source", "ocr")
UA = {"User-Agent": "TRPL-BadlandsCowboy/1.0"}

def get(url, tries=6):
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120) as r:
                return r.read()
        except Exception as e:
            time.sleep(5 * (i + 1))
    raise RuntimeError(url)

def alto_text(b):
    root = ET.fromstring(b); ns = root.tag.split("}")[0] + "}"
    blocks = []
    for tb in root.iter(ns + "TextBlock"):
        lines = [" ".join(s.get("CONTENT", "") for s in tl.iter(ns + "String")) for tl in tb.iter(ns + "TextLine")]
        lines = [l for l in lines if l.strip()]
        if lines: blocks.append("\n".join(lines))
    return "\n\n".join(blocks)

def do_issue(path):
    issue_dir = path.rsplit("/", 1)[0]          # sn84024777/<reel>/<YYYYMMDDEE>
    mets = get(BASE + path).decode("utf-8")
    date = re.search(r"(\d{4}-\d{2}-\d{2})", mets).group(1)
    out = os.path.join(ROOT, date); os.makedirs(out, exist_ok=True)
    altos = sorted(set(re.findall(r'xlink:href="\./(\d{4})\.xml"', mets)))
    pages = []
    for n, stem in enumerate(altos, 1):
        rel = f"{issue_dir}/{stem}"
        pages.append({"seq": n, "file": stem,
                      "iiif": IIIF + rel.replace("/", ":"),
                      "pdf": BASE + rel + ".pdf", "alto": BASE + rel + ".xml"})
        ap = os.path.join(out, f"p{n}.alto.xml")
        if not os.path.exists(ap):
            b = get(BASE + rel + ".xml"); open(ap, "wb").write(b)
        open(os.path.join(out, f"p{n}.txt"), "w").write(alto_text(open(ap, "rb").read()))
    json.dump({"date": date, "edition": 1, "lccn": LCCN,
               "loc_url": f"https://www.loc.gov/item/{LCCN}/{date}/ed-1/",
               "pages": pages}, open(os.path.join(out, "manifest.json"), "w"), indent=1)
    return date, len(pages)

def main():
    batch = get(BASE + "batch_1.xml").decode()
    paths = re.findall(rf'lccn="{LCCN}"[^>]*>([^<]+)<', batch)
    paths = [p.replace("_1.xml", ".xml") for p in paths]
    print(len(paths), "issues")
    with ThreadPoolExecutor(6) as ex:
        for d, n in ex.map(do_issue, paths): print(d, n, flush=True)

if __name__ == "__main__":
    main()
