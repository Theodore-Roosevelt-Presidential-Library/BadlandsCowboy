# Bad Lands Cow Boy: people-matching brief

You are matching the person names tagged in the transcriptions of *The Bad Lands Cow Boy* (Medora, Dakota Territory, 1884–86) into a people database for a public history site run by the Theodore Roosevelt Presidential Library. Accuracy beats completeness. When you are unsure that two names are the same person, keep them apart.

## Input
`/tmp/bc_people/shard_<X>.txt`, one name string per line, tab-separated:
`name  <TAB>  number of items  <TAB>  first..last issue date  <TAB>  up to 3 contexts (issue date + one-line summary)`

The lines are sorted by surname, so spelling variants usually sit next to each other.

## Task
Group the strings into **people**. Every input string must appear exactly once in your output, either in some person's `aliases` or in `not_people`.

Merge strings when the evidence says they are the same person:
- **Spelling and printing variants.** For example "Rosevelt", "Rousevelt" and "Teeodore Roosevelt" are Roosevelt; "Seawall" and "Sewell" are Sewall; "Mores" is "Morès".
- **Initials versus full names, nicknames and titles.** For example "Wm. Merrifield", "W. H. Merrifield", "Bill Merrifield" and "Mr. Merrifield", or "Johnny Goodall" and "John Goodall".
- **A bare surname or title**, such as "Mr. Paddock", only when the contexts and dates show it is clearly one specific person, or when only one person with that surname appears in the paper. Otherwise put it in an unresolved person entry of its own named as printed, with `"ambiguous": true`.

Do **not** merge:
- relatives, such as a father and son, brothers, or Mr. and Mrs. The Ferris brothers are Sylvane (Sylvanus) and Joe (J. A.), two people.
- different people who share a surname.

`not_people` are strings that aren't a single person: firms ("Roberts & Co."), groups ("the Ferris brothers"), places, ships, horses, or junk. If such a firm or pair is clearly tied to named people, say so in `note`.

## Output
Write `/tmp/bc_people/out_<X>.json` (valid JSON):

```json
{"people": [
  {"name": "William H. Merrifield",
   "aliases": ["Bill Merrifield", "W. H. Merrifield", "Wm. Merrifield", "Merrifield"],
   "role": "Manager of Roosevelt's Maltese Cross ranch, with Sylvane Ferris",
   "group": "ranching",
   "notable": false,
   "ambiguous": false,
   "note": ""}
 ],
 "not_people": [{"string": "Roberts & Co.", "note": "firm; probably Bob/Lloyd Roberts"}]}
```

- `name` is the fullest correct form found in the strings, or one you are sure of from the contexts. Never add first names that you know only from outside knowledge unless you are certain (Theodore Roosevelt, Marquis de Morès, A. T. Packard, Grover Cleveland and the like).
- `role` is one short phrase saying who this person was **according to the contexts**, e.g. "Medora saloon keeper", "Dickinson lawyer", "Northern Pacific conductor", "President of the United States". Use null if the contexts don't say. Do not invent.
- `group` is one of: `roosevelt-circle` (TR and his partners, ranch hands and family), `mores-circle` (the Marquis, the Marquise and his managers), `ranching`, `business`, `town` (Medora residents and officials), `law` (lawyers, judges, sheriffs, defendants), `railroad`, `politics` (territorial and national politicians), `press` (editors and papers' people), `military`, `clergy`, `native` (Native Americans), `other`.
- `notable` is true for people of national or territorial prominence: presidents, governors, generals, famous outlaws.

Keep every scratch file in `/tmp/bc_people/work_<X>/`. Other agents are working at the same time. Validate the output: it must parse as JSON, and the set of all `aliases` plus `not_people` strings must equal the set of input names exactly. Check with a short Python script that reads the shard file and your output. Reply with only: the shard, the number of people, the number of not_people, and how many merges you were unsure about.
