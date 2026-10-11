# Bad Lands Cow Boy reprint search log

## Method (applies to every date)

1. **Phrase searches** of the Chronicling America JSON API, one window per missing issue (the day after the issue to roughly 5 to 7 weeks later): `"cow boy" medora`, `"bad lands cow boy"`, `"cow boy" packard`, `"medora cow boy"`, `"the cow boy says"`, `"says the cow boy"`, `"bad lands cowboy"`, `"cow boy" "little missouri"`, `"cow boy" "bad lands"`, `"medora cowboy"`, `cowboy medora`, `"cow boy" roosevelt`, `"bad lands" "cow boy" says`. Hits from the Cow Boy itself (sn84024777) were dropped.
2. **Page scan of the likeliest exchanges** for the day after each missing issue through 28 days later. Every page matching `cow` or `cowboy` was checked in 15 papers: Bismarck Weekly Tribune, Daily Yellowstone Journal, Jamestown Weekly Alert, St. Paul Daily Globe, Hoof and Horn, Livingston Enterprise, Livingston Daily Enterprise, River Press, Dickinson Press, Billings Herald, Emmons County Record, Hope Pioneer, Pembina Pioneer Express, New North-West and Bozeman Weekly Chronicle. That came to about 3,000 pages. Each page's ALTO OCR was searched for credit forms such as "Bad Lands Cow Boy", "Medora Cow Boy/Cowboy", "Cow Boy says/:", "says the Cow" and "the Cow Boy".
3. **Extra `medora` search** for the dates that were still empty (1884-09-11, 1886-04-08, 04-22, 04-29, 05-20, 08-05, 09-16), from the day after the issue to 24 days later, across all papers. Targeted searches were also run for specific items (Black Hills "moral character", Roosevelt "spectacles", Roosevelt/Finnegan boat thieves, "big plateau" bulls).
4. **Cross-check against surviving issues.** Every candidate was searched in `transcriptions/*.json` **and** in the raw OCR (`ocr/<date>/p*.txt`, hyphenation joined) of all surviving issues from about 8 weeks before the reprint. The cross-check showed that transcriptions can omit an item (the Oberly paragraph of 1885-10-15 is only in the OCR), so both sources were checked every time. An item was kept only if it was absent from every surviving issue in range. Every kept item was cropped from the IIIF image at full resolution and transcribed from the image.

**What the cross-checks showed.** Reprints lag the Cow Boy far more than "the most recent issue" rule assumes:

| Reprint | Cow Boy issue it came from | Lag |
|---|---|---|
| Bismarck Weekly Tribune, 1884-09-19, buffalo herd | 1884-09-04 | 15 days |
| Emmons County Record, 1885-10-28, sixty-foot coal vein | 1885-10-15 | 13 days |
| Jamestown Alert, 1885-10-22, Oberly / Indian schools | 1885-10-15 | 7 days |
| Jamestown Alert, 1885-10-29, "Come to Our Arms" | 1885-10-22 | 7 days |
| Livingston Enterprise, 1886-03-20, Sitting Bull | 1886-03-18 | 2 days |
| Jamestown Alert, 1886-04-01, TR arrives | 1886-03-25 | 7 days |
| Jamestown Alert, 1886-04-22, TR captures boat thieves | 1886-04-15 | 7 days |
| Bismarck Weekly Tribune, 1886-09-03, George Fraser killed by lightning | 1886-08-26 | 8 days |
| Hoof and Horn (Ariz.), 1886-07-29, beeves ripe | 1886-06-17 | 6 weeks |

These checks confirmed the method. They also showed that the Montana dailies picked up items within 2 days, while Hoof and Horn and Texas papers ran items weeks late. Confidence below reflects this: an item is "high" only where the surviving neighbours rule out other issues *and* the timing fits.

## Per missing issue

### 1884-09-11: nothing found
Phrase searches (Sep 12 to Oct 20, 1884), page scan of the 15 papers, and a `medora` search. Hits were the buffalo item in the Bismarck Weekly Tribune of Sep 19 (traced to the surviving Sep 4 issue), a press-convention delegate list naming Packard (Sep 26), a Bismarck note on a Methodist church at Medora (Oct 10, no Cow Boy credit), and syndicated Medora/de Mores features naming the paper (Omaha Bee Sep 29, East Providence Eagle Oct 8). None is a reprint from Sep 11.

### 1885-10-08: 2 items
- Daily Yellowstone Journal, 1885-10-10, p3: the Cow Boy's view that the fire did not badly damage the range ("no grass to loan"). **High.**
- Hope Pioneer, 1885-10-23, p1: 25-mile fire furrow; Cow Boy proposes double furrows. **Medium.**
- Excluded after cross-check: Jamestown Alert Oct 22 Oberly (in the Oct 15 OCR), Emmons County Record Oct 28 coal vein (Oct 15), Yellowstone Journal Oct 17 hay loss (Oct 15), Jamestown Alert Oct 29 "Come to Our Arms" (Oct 22).

### 1885-11-05: 2 items
- Jamestown Weekly Alert, 1885-11-12, p8: "The Bad Lands Cow Boy of last week" on the end of the de Mores slaughter-house season. **High.**
- Austin Weekly Statesman, 1885-11-19, p6 (also St. Johns Herald, Ariz., Nov 26): Quarter Circle Diamond, LC and Maltese Cross bulls wintering at the Big Plateau. This must come from a missing issue (Oct 8, Nov 5 or Nov 12); Nov 5 is the best guess. **Low.**
- Not kept: the Bismarck Weekly Tribune of Nov 6 quotes the Cow Boy editor from O. H. Holt's pamphlet "Delightsome Land" (not a dated issue), and its "Hallowe'en in the Bad Lands" piece does not credit the Cow Boy.

### 1885-11-12: 4 items
- Daily Yellowstone Journal, 1885-11-14, p1: party sent down the river to move the Indians back to the reservation returns (—Medora Cow Boy). **High.**
- Daily Yellowstone Journal, 1885-11-14, p1: J. B. Walker skipped leaving debts. **Medium**, since Nov 5 is possible.
- St. Paul Daily Globe, 1885-11-17, p5: same Walker news, debts "about $1,000". **Medium.**
- Rock Island Argus, 1885-11-24, p2 (also Pembina Pioneer Express Nov 27, Superior Times Dec 26, Sedalia Bazoo Jan 19, Columbus Journal Feb 3, South Kentuckian Mar 16): "all the Black Hills wants is a railroad and a new moral character for its business men." **Medium.**
- Excluded: Livingston Enterprise Dec 5 mountain sheep (Nov 26), Yellowstone Journal Dec 5 Fitzgerald–Lang brand case (Dec 3).

### 1885-12-10: 1 item
- Bismarck Weekly Tribune, 1885-12-18, p8: Cow Boy on the move to defeat Billings county organization. **High.**

### 1886-01-07: 1 item
- Jamestown Weekly Alert, 1886-01-14, p5: 30,000 lb of deer (about 600 saddles) shipped from Medora this winter. **High.**

### 1886-03-04: 3 items
- Daily Yellowstone Journal, 1886-03-06, p1 (also New North-West Mar 19): 38 voters' agreement against roads at public expense. **High.**
- Wahpeton Times, 1886-03-18, p2: syndicated Dakota column; northern ranges winter loss about 5 per cent. The same column ran in Reporter and Farmer, Warner Sun and De Smet Leader, and on the Cow Boy's own ready-print page of Mar 18. **Medium.**
- Hoof and Horn, 1886-03-25, p2: International Range Association, quarantine and middlemen. **Medium** (Jan 7 is a remote alternative).
- Excluded: Sitting Bull item (Jamestown Mar 25, Livingston Mar 20; from Mar 18), Globe Mar 30 winter losses under 2% (Mar 25), Jamestown Apr 1 TR arrival (Mar 25).

### 1886-04-08: nothing found
Phrase searches, page scan, `medora` search, and a `roosevelt finnegan` search (Apr 1 to May 15). The only Cow Boy reprints in the window were the TR boat-thief capture (Jamestown Apr 22; surviving Apr 15 issue) and the libel-suit item (St. Paul Globe May 11; surviving May 6 issue). It is notable that nothing from Apr 8, which fell during Roosevelt's pursuit of the boat thieves, turned up.

### 1886-04-22: nothing found
Same searches. Window hits all traced to Apr 15 or May 6.

### 1886-04-29: nothing found
Same searches. Window hits all traced to May 6 (the Bismarck ball libel, Globe May 11) or were unrelated.

### 1886-05-20: nothing found
Same searches. The Roosevelt "spectacles" item could belong here instead of May 27 (see below).

### 1886-05-27: 1 item
- The River Press (Fort Benton), 1886-06-02, p4 (also New North-West Jun 4, Bozeman Weekly Chronicle Jun 9): "Theodore Roosevelt does his full day's work with the rest of the men, and except for the big spectacles, would pass for a cow puncher anywhere." **Medium**, since May 20 is possible.

### 1886-06-03: 1 item
- Livingston Enterprise, 1886-06-12, p1, credited only "Cowboy:": drought, grass not half grown. **Medium.**
- Excluded: Yellowstone Journal Jun 13 / River Press Jun 23 Rumsey roping prize (Jun 10), Yellowstone Journal Jun 19 Jess Reeves jack rabbit (Jun 17).

### 1886-06-24: 2 items
- Bismarck Weekly Tribune, 1886-07-02, p1: slaughter house to begin work July 1, beef two weeks early. **High.**
- Hoof and Horn, 1886-07-15, p5: the "108" brand horse-thief story (—Medora (Dak.) Cow-Boy). **Medium.**
- Excluded: Bismarck Jun 25 "Buckskin" Harrison and Sebastian–Cary items (Jun 17), Jamestown Jul 1 lariat story (Jun 17), Jamestown Jul 8 alfalfa (Jun 17), Hoof and Horn Jul 29 beeves (Jun 17), River Press Jul 21 118° heat (Jul 8), Globe Jul 20 heat and Bismarck Jul 23 "oldest citizen" (Jul 15), New North-West Jul 16 Dickinson Fourth of July (Jul 8).

### 1886-07-29: 1 item
- Bismarck Weekly Tribune, 1886-08-06, p5, quoting the Mandan Pioneer: de Mores's lost rings and the ransom letter. **Medium**, since Aug 5 is possible.
- Excluded: River Press Jul 28 Bill Lundy (Jul 15), Hoof and Horn Aug 5 horse prices (Jul 22).

### 1886-08-05: nothing found
Phrase searches, page scan and `medora` search. The rings item (above) and the NP rate item (below) could each belong to Aug 5 instead.

### 1886-08-12: 2 items
- Bismarck Weekly Tribune, 1886-08-20, p4: the Cow Boy backs H. R. Lyon for the legislature. The surviving Aug 19 issue refers to "our proposal last week". **Medium.**
- Hoof and Horn, 1886-08-19, p3: Northern Pacific halves stock rates east of Mandan. **Low** (Jul 29, Aug 5 or Aug 12).
- Excluded: Bismarck Sep 3 Fraser lightning death (Aug 26), Globe Aug 28 / Turner County Herald Sep 9 thirty-three chickens (Aug 19).

### 1886-09-16: nothing found
Phrase searches, page scan and `medora` search. Hoof and Horn of Sep 30 ("rest on their oars") traced to the surviving Sep 2 issue.

### 1886-09-30: 1 item
- Jamestown Weekly Alert, 1886-10-07, p8 ("From Sunday's Daily", i.e. Oct 3): 200 horses driven through Medora, to range near Jamestown. **High.**
- Excluded: Bismarck Oct 15 de Mores return and soup contract (Oct 7).

### 1886-12-02: 9 items
- Bismarck Weekly Tribune, 1886-12-10, p5, "Medora. The following items from the Cow Boy:". Seven items: butchers to Kansas City; G. G. Bond; Ferris buys Fitzgerald house; **Cow Boy office moved over the river to the Cantonment**; Ellison re-icing stations; Van Driesche to Europe / Foley in charge; stockgrowers declare range fully stocked. **High.** The surviving Dec 9 issue says Ellison "left last Friday", which fits.
- Jamestown Weekly Alert, 1886-12-09, p8: dog and buffalo wolf killing cattle near Mingusville. **High.**
- Livingston Enterprise, 1886-12-11, p1: cattle killed by trains; NP considering track riders. **High.**
- Not kept: Bismarck Dec 24 Packard defeat and the doggerel "tribute" (a Tribune item, not a Cow Boy reprint), Globe Jan 3, 1887 Myers case (Dec 16).
