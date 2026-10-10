# The Bad Lands Cow Boy

**Live:** https://badlandscowboy.labs.trlibrary.com

Every surviving issue of *The Bad Lands Cow Boy* (A. T. Packard, Little Missouri and Medora, Dakota Territory, Feb. 7, 1884 to Dec. 23, 1886), transcribed and indexed day by day. Built by the Theodore Roosevelt Presidential Library.

## What's in the site
- **This Week in Medora**: what the paper reported for any calendar week, across 1884–1886. It defaults to today and is embeddable.
- **Timeline**: 4,249 dated events, filterable by month, topic, Roosevelt and de Morès.
- **Roosevelt in the Cow Boy**: every item that names TR (85), plus an optional view of his ranches and partners.
- **Read the Paper**: transcription beside the zoomable LOC page scan. Click an item and the scan zooms to it.
- **Search**: full text of about 513,000 transcribed words.
- **The Ads**: gallery of 193 distinct ads (incl. cattle and horse brands), each cropped from the scan where it first ran, with wording, what it sold, the pitch and prices; plus advertiser and brand lists. Catalog: `source/ads/ads.json` (rules in `scripts/ADS_BRIEF.md`).
- **Embed & Data**: `embed.js` widgets, plus `data/events.csv` and `data/events.json`.

## Layout
| Path | What |
|---|---|
| `index.html`, `assets/`, `embed.js`, `CNAME` | The static site (GitHub Pages, served from the repo root) |
| `data/` | Site data compiled by `scripts/build_site_data.py`. Don't hand-edit. |
| `source/transcriptions/<date>.json` | **Master transcriptions**, one per issue: articles (text, page, region, confidence) and dated events. Edit these to correct text. |
| `source/ocr/<date>/` | LOC manifest, raw OCR text and OCR block coordinates per page |
| `scripts/` | Fetch, prep, crop and build scripts, plus `TRANSCRIBE_BRIEF.md` (the transcription rules) |

## Rebuild after editing a transcription
```
python3 scripts/build_site_data.py
```

## Re-fetch from the Library of Congress (not normally needed)
```
python3 scripts/fetch_batch.py      # tile.loc.gov batch → source/ocr (ALTO is git-ignored)
python3 scripts/prep_blocks.py      # block coordinates + numbered OCR
```

## How the transcriptions were made
AI (Claude) read each column of local content from the full-resolution LOC page images, using the LOC OCR only as a guide. It kept the original spelling and marked `[illegible]` and `[word?]` where needed. Ready-print (syndicated) pages are summarized, not transcribed. Events were dated from the paper's own relative wording ("Monday" means the Monday before the Thursday issue), with the reasoning kept in each event's `date_basis`.

**Check every quote against the page image before publishing.** One-click links are on every item.

## Known gaps
- 20 weeks are missing from the LOC run (listed on the About page). Yale University Library holds an original Sept. 11, 1884 issue.
- Pages 3–4 of Nov. 25, 1886 were never scanned.
- Page 1 of Nov. 18, 1886 still needs a human transcription. An automated content filter stopped the AI pass; see the scan.

## Sources
Page images and OCR: Library of Congress, Chronicling America (LCCN sn84024777), from State Historical Society of North Dakota microfilm. Public domain.
