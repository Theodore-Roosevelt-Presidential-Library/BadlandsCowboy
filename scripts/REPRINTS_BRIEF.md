# Bad Lands Cow Boy: recovering missing issues from other papers

Twenty weeks of *The Bad Lands Cow Boy* (Medora / Little Missouri, Dakota Territory) are missing from every surviving file. Frontier papers constantly reprinted each other with credit lines like "— Bad Lands Cow Boy", "says the Cow Boy" or "The Medora Cow Boy says". Your job is to recover what the missing issues printed, from those reprints, for a public history site of the Theodore Roosevelt Presidential Library. **Accuracy beats completeness. Never invent or paraphrase what was printed: transcribe from the page image.**

Missing issue dates (Thursdays): 1884-09-11, 1885-10-08, 1885-11-05, 1885-11-12, 1885-12-10, 1886-01-07, 1886-03-04, 1886-04-08, 1886-04-22, 1886-04-29, 1886-05-20, 1886-05-27, 1886-06-03, 1886-06-24, 1886-07-29, 1886-08-05, 1886-08-12, 1886-09-16, 1886-09-30, 1886-12-02.

## Finding reprints
- Search the Library of Congress's Chronicling America full text with the JSON API, which works from this machine: `https://www.loc.gov/collections/chronicling-america/?q=<query>&dates=<from>/<to>&fo=json&c=100` (each result has an id, page URL, date, title and often `full_text` / OCR links). Try queries like `"cow boy" medora`, `"bad lands cow boy"`, `"medora cow boy"`, `"the cow boy says"`, `"cow boy" packard`. Restrict dates to the missing issue date through about 4 weeks after it. Papers likely to quote it: Bismarck Weekly Tribune, Mandan Pioneer, Dickinson Press, Glendive Independent / Times, Yellowstone Journal (Miles City), St. Paul Globe, Jamestown Alert, Sioux Falls, Black Hills papers, and also national papers. Don't hammer the API: pause about 1 second between requests, and back off on 429.
- `www.loc.gov` can rate-limit. Page images and OCR also come from `tile.loc.gov`; IIIF images use the pattern `https://tile.loc.gov/image-services/iiif/<service id>/<region>/<size>/0/default.jpg`, where the region may be `pct:x,y,w,h`. Take the service id from the page's JSON (`https://www.loc.gov/resource/<lccn>/<date>/ed-1/?sp=<page>&fo=json`, under `resource.image` or similar).
- For each candidate, decide which Cow Boy issue the item came from. It is the most recent Cow Boy issue before the reprint's date, unless the item itself dates it. **Keep only items that most likely came from a missing issue.** Items from issues that do survive are not needed; note a few of those only as a cross-check of your method (compare them with `/home/claude/bc/source/transcriptions/<date>.json`).
- Also note any *non-reprint* report about Medora in those weeks only if it explicitly cites the Cow Boy.

## Transcribing
For every kept item, crop the item at full resolution from the IIIF image (e.g. `pct:` regions, `full` or `!2000,2000` size) and view it. Transcribe the item verbatim from the image, keeping the period spelling. The OCR is a guide only. Mark unreadable words `[illegible]`.

## Output
Write `/home/claude/bc/source/reprints/reprints.json` (valid JSON):
```json
[{"missing_issue": "1885-10-08",
  "confidence": "high|medium|low",
  "why": "Glendive Independent of Oct 10, 1885 credits 'Bad Lands Cow Boy'; the only Cow Boy between was Oct 8",
  "source": {"title": "Glendive Independent", "place": "Glendive, Mont.", "date": "1885-10-10", "page": 3, "lccn": "sn…", "url": "https://www.loc.gov/resource/…", "iiif": "https://tile.loc.gov/image-services/iiif/service:…", "region": [x, y, w, h]},
  "credit_line": "as printed, e.g. '—Bad Lands Cow Boy'",
  "text": "verbatim transcription",
  "summary": "one plain sentence",
  "people": ["…"], "tags": ["ranching"],
  "event_date": "YYYY-MM-DD or null", "event_precision": "day|week|month|approx"}]
```
`region` is in percent of the page. Tags use the project vocabulary: tr, mores, ranching, roundup, brands, railroad, stage, business, building, town-life, saloons, law, crime, courts, politics, weather, wildlife, hunting, mining, coal, Native-Americans, military, visitors, social, deaths, health, press, land, water, fire, holidays.

Also write `/home/claude/bc/source/reprints/search_log.md`: for each missing date, what you searched and what you found, including "nothing found". Keep scratch files in `/tmp/bc_reprints/`. Reply with only: items recovered per missing date, how many are high confidence, and anything notable (for example a Roosevelt item).
