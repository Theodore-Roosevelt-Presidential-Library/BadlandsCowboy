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
- Nov. 25, 1886 survives only in part. The film has page 1, the top third of page 2 and most of page 4 (pasted together as one frame). Page 3, the rest of page 2 and the bottom edge of page 4 are not on it.
- Before asking an institution for a copy, check `source/holdings_log.md`. It records who has already been checked and what they hold, so the same dead ends aren't searched twice.
- Page 1 of Nov. 18, 1886 still needs a human transcription. An automated content filter stopped the AI pass; see the scan.

## Sources
Page images and OCR: Library of Congress, Chronicling America (LCCN sn84024777), from State Historical Society of North Dakota microfilm. Public domain.

## People and recovered items (October 2026)

- `source/people/people.json` is the master people file: 1,812 people matched across the paper's spellings, with bios for the 454 most mentioned. Bios are written only from the Cow Boy's own items and were fact-checked against the full text (`source/people/fact-check-log.md`; open questions in `source/people/review.md`). Pipeline: `scripts/collect_people.py` → matching (brief `scripts/PEOPLE_MATCH_BRIEF.md`) → `scripts/people_prep.py` → bios (`PEOPLE_BIO_BRIEF.md`) → `scripts/people_finalize.py` → checks (`PEOPLE_CHECK_BRIEF.md`) → `scripts/people_apply_checks.py`.
- `source/reprints/reprints.json`: items from missing issues, recovered where other papers reprinted them (brief `scripts/REPRINTS_BRIEF.md`, log `source/reprints/search_log.md`).
- Site: People tab (`#people`, `#people/<id>`), mention links open `#paper/<date>/<item>/p:<id>` with the name highlighted, and missing issues open a page of recovered items. Embeds accept `data-heading="off"`.
