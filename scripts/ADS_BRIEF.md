# Bad Lands Cow Boy: ad catalog brief

Build a catalog of the advertisements in *The Bad Lands Cow Boy* (Medora, Dakota Territory, 1884–86). Each ad is cataloged once, from the issue where it first appears. The site will show each ad as a crop of the original scan, with what it was trying to sell and how it pitched it. Accuracy beats completeness. Never invent.

## Tools (repo root /home/claude/bc)
- `python3 scripts/crop.py thumb DATE PAGE` gives a whole-page view for finding ads.
- `python3 scripts/crop.py region DATE PAGE X Y W H` gives a full-resolution crop (all values in % of the page). Use it to read the ad and to check your box.
- `source/transcriptions/DATE.json` has each issue's "advertising" directory entries, which tell you which ads are on which page.
- Keep all scratch files in `/tmp/bc_ads/<your batch id>/`. Other agents are running at the same time.

## For each advertiser you are given
1. Find its ad on the page images of the issue named. Ads are usually on pages 1 and 4, sometimes on 2 or 3.
2. Measure a **tight bounding box** around the whole ad, including its border, as [x, y, w, h] in percent of the page. Check it by cropping exactly that box. The whole ad must be inside, with little else.
3. Transcribe the ad's full wording as printed, keeping line breaks where they matter. Mark unreadable words `[illegible]`. For cattle-brand cards, transcribe the text and describe the brand mark and the cut, e.g. "cut: steer with KC on left side".
4. Fill in the fields below.

## Output: `/tmp/bc_ads/<batch id>/ads.json`, a JSON list of:
```json
{"advertiser": "Little Tom's Saloon", "issue": "1884-06-26", "page": 4, "box": [27.4, 52.0, 12.6, 9.8],
 "kind": "business|brand",
 "category": "saloon|hotel|restaurant|general store|groceries|clothing|hardware & guns|saddlery & harness|wagons & vehicles|drugs & medicine|doctor|lawyer|bank & insurance|real estate & town lots|railroad & stage|livestock & ranch supplies|cattle brand|horse brand|liquor & cigars|newspaper & printing|services|manufacturer|other",
 "town": "Little Missouri, Dak.",
 "local": true,
 "text": "LITTLE TOM'S\nSALOON.\nThere's Rest for the Weary.\nThe \"Festive Barkeep\" ...",
 "sells": "Saloon: drinks, cigars; Cow-boy bitters a specialty",
 "pitch": "Humor and comfort: 'There's Rest for the Weary'; the 'Festive Barkeep' of many years' experience",
 "prices": "$8 per thousand (brick)",
 "illustrated": true,
 "notes": "anything notable: cut/illustration, unusual claim, a person later famous, etc.",
 "confidence": "high|medium|low"}
```
- `local` is true when the business is in the Badlands area (Medora, Little Missouri, Belfield, Dickinson, Mingusville, Glendive).
- `pitch` is how the ad tries to persuade: humor, low prices, quality, novelty, health claims, fear, prestige, convenience, being "the only" or "the best". Use the ad's own words where you can.
- If you can't find an assigned advertiser on the pages, include it with `"box": null` and a note. Never guess a box.
- Validate with `python3 -c "import json;json.load(open(...))"`. Reply with only: batch id, ads cataloged, ads not found.
