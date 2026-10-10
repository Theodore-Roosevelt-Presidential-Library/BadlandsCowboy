# Bad Lands Cow Boy: issue transcription and event extraction brief

You are transcribing one weekly issue of *The Bad Lands Cow Boy* (A. T. Packard, editor), the newspaper of Little Missouri / Medora, Dakota Territory, 1884–1886. The output feeds a public history site run by the Theodore Roosevelt Presidential Library, so **accuracy beats completeness**. Never invent, guess or "improve" content. When you can't read something, mark it.

## Inputs (repo root: /home/claude/bc)
- `source/ocr/<DATE>/manifest.json`: the page list.
- `source/ocr/<DATE>/p<N>.num.txt`: raw OCR for each page, split into blocks marked `[pNbK]`. The OCR is often poor. Use it to find content and as a reading aid, never as the final text where it disagrees with the image.
- Page images, through `python3 scripts/crop.py`:
  - `crop.py thumb DATE PAGE` prints the path of a whole-page view (~1400px). Use it for layout only; it is too small to read body type.
  - `crop.py region DATE PAGE X Y W H` crops a region at full resolution. All values are percent of the page. Tall regions are auto-split into readable slices. **This is where you read text.** One newspaper column is roughly 12–13% of page width. Start a column near the top (y≈5) and go down in chunks (e.g. H=28, which gives 2–3 slices per call). View every slice the call prints with the Read tool.

## Working files
Other agents are transcribing other issues at the same time. Keep **every** scratch file, note and build script in your own folder, `/tmp/bc_work/<DATE>/`, and never in a shared scratchpad. Write only your own `source/transcriptions/<DATE>.json`. Some issues include a duplicate scan of another page. Check for this, and note it in `pages[].notes` instead of transcribing the page twice.

## Steps
1. View the thumb of every page. Classify each page and column as **local** or **ready-print**.
   - **Local**: Packard's own content: masthead, local news items, editorials, letters, correspondence from nearby points, local and territorial politics, cattle and range news, railroad time table, legal notices, local ads, cattle-brand ads.
   - **Ready-print** ("patent inside"): syndicated national filler such as farm hints, fiction, national and foreign wire news, humor, and patent-medicine ads. Its type and headings look different, and it usually fills whole pages.
2. **Ready-print**: do not transcribe. Record one `articles` entry per page, `section: "ready-print"`, with a one-sentence summary of what the page carries.
3. **Local news, editorials, correspondence, local politics, range and cattle news, legal notices**: transcribe in full **from the image**, column by column, item by item.
   - Keep the original spelling, punctuation, capitalization and period wording. Don't modernize. Rejoin words hyphenated across line breaks. Paragraphs are separated by a blank line.
   - Each short local item (the paper runs many one-paragraph items in a column) is its own article. Its headline is null unless printed, and `section` is "local".
   - Unreadable words become `[illegible]`. A best reading you are unsure of becomes `[word?]`.
4. **Display ads and cattle-brand ads**: don't transcribe them in full. Record one entry per page, `section: "advertising"`, whose `text` lists each advertiser in one line, e.g. `Little Tom's Saloon, Little Missouri — "There's Rest for the Weary"` or `Brand: Sloping Bottom Ranch, Lloyd Roberts, P.O. Medora — range Little Missouri 7 mi S of N.P.`. This is a directory. Accuracy matters more than prose.
5. Extract **events** from the local content: things that happened or were reported in and around Medora and the Badlands. Include arrivals and departures, business openings, building, cattle drives and roundups, weather, fires, crimes and court actions, deaths, marriages and births, politics, railroad and stage-line news, and visits by notable people. Include every reference to **Theodore Roosevelt**, the **Marquis de Morès**, Packard, and Roosevelt's associates: Sylvane Ferris, Bill Merrifield, Bill Sewall, Wilmot Dow, the Maltese Cross, the Elkhorn. Watch for other Roosevelts too: a "George W. Roosevelt, consul" is not TR. Set `tr: true` only when the text clearly means Theodore Roosevelt.

## Dating events
The paper was a weekly that came out on Thursday (check the masthead date). Resolve relative dates against the issue date:
- "Monday" or "last Monday" means the most recent Monday before the issue date. "Yesterday" means the day before.
- "Last week" gives a week range. "Next Saturday" is a future or planned event.
- Give `date` as YYYY-MM-DD and `date_precision` as "day" | "week" | "month" | "approx". If no date can be resolved, use the week before the issue (`date` = issue date minus 7 days, `date_end` = issue date, precision "week").
- Put your reasoning in `date_basis`, e.g. `"Monday" before Thu 26 Jun 1884`. Future or planned events get `planned: true`.

## Output: write `source/transcriptions/<DATE>.json` (UTF-8, valid JSON)
```json
{
  "date": "1884-06-26",
  "masthead": "Thursday, June 26, 1884",
  "volume": "Vol. 1, No. 21",
  "pages": [{"seq": 1, "kind": "local|ready-print|mixed", "notes": "col 1-2 local items; cols 3-7 ads and brands"}],
  "articles": [
    {"id": "a1", "page": 4, "cols": "1", "region": [8.2, 20, 13, 30],
     "section": "local|editorial|correspondence|politics|range|railroad|legal|advertising|ready-print|masthead",
     "headline": null, "text": "…", "summary": "one sentence",
     "people": ["Theodore Roosevelt"], "method": "image|ocr", "confidence": "high|medium|low"}
  ],
  "events": [
    {"id": "e1", "date": "1884-06-23", "date_end": null, "date_precision": "day", "date_basis": "…", "planned": false,
     "title": "Theodore Roosevelt calls at the Cow Boy office",
     "summary": "One or two plain sentences of what the paper reported, attributed (\"The Cow Boy reported…\" is implied, do not editorialize).",
     "excerpt": "a short verbatim quote from your transcription (≤ 40 words)",
     "people": ["Theodore Roosevelt"], "places": ["Medora"],
     "tags": ["tr", "visitors", "politics"], "tr": true, "mores": false,
     "article": "a7", "confidence": "high|medium|low"}
  ]
}
```
Tag vocabulary (use only these): tr, mores, ranching, roundup, brands, railroad, stage, business, building, town-life, saloons, law, crime, courts, politics, weather, wildlife, hunting, mining, coal, Native-Americans, military, visitors, social, deaths, health, press, land, water, fire, holidays.

`region` is the box you read, in percent of the page [x, y, w, h], so the site can link straight to that spot on the scan. `confidence` is low when the scan is damaged or you had to rely on the OCR. Be honest.

## Done
Validate with `python3 -c "import json;json.load(open('source/transcriptions/<DATE>.json'))"`. Then reply with only: the issue date, the number of articles, the number of events, the number of TR events, and any serious problems (pages missing or unreadable). Do not paste the transcription into your reply.
