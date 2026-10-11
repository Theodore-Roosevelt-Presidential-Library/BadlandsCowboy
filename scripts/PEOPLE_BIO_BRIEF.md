# Bad Lands Cow Boy: people bios brief

Write short bios for people named in *The Bad Lands Cow Boy* (Medora, Dakota Territory, 1884–86). They go on a public history site of the Theodore Roosevelt Presidential Library, beside links to every item that names each person. **Accuracy beats everything.** A bio says only what the paper says, and says that it is the paper saying it.

## Input
`/tmp/bc_people/bio_in_<K>.txt` holds one block per person:
- a header: id, name, aliases, matched role, group, and the item count and date range;
- then excerpts, one per mention, each tagged `[YYYY-MM-DD/aid]`. These are the issue date and the item id. For people with many items, a sample of 30 is spread across the run.

The excerpts are transcriptions of 1880s newsprint, with the original spelling.

## For each person, write
- `bio`: what the Cow Boy tells us about this person, in plain present-day English, past tense. Who they were (occupation, ranch or business, town), what they did in the paper's pages, and how that changed over 1884–86.
  - Length: 2 sentences for 3–9 items; 3–4 sentences for 10–29; 4–6 sentences for 30 or more.
  - Be specific: name the ranch, the business, the office, the event, with months and years.
  - Stick to the excerpts. No outside knowledge, with one exception: for nationally famous people (Theodore Roosevelt, Grover Cleveland, Ulysses S. Grant, Sitting Bull and the like) you may add one opening clause saying who they were, e.g. "The future president, then a New York assemblyman and Bad Lands rancher, ...". Keep it to facts that no historian would dispute.
  - Do not editorialize, praise, or speculate ("likely", "probably"). If the excerpts conflict, say so ("The paper calls him both ... and ...").
  - The paper's own language about Native Americans, Chinese immigrants and others can be offensive. Describe what was reported in neutral terms; don't repeat slurs.
- `role`: one short phrase (at most 12 words), corrected from the excerpts if the matched role is wrong. Use null if unknown.
- `moments`: 2 to 5 key items (only 1 or 2 for people with fewer than 6 items). Each is `{"ref": "YYYY-MM-DD/aid", "label": "…"}`, with a label of at most 12 words, past tense, saying what happened ("Elected chairman of the Little Missouri stockmen"). Each `ref` must be copied exactly from an excerpt tag.
- `flags`: a list of problems a human should check: an excerpt about a different person under this name, a likely wrong merge, unreadable text. Leave it empty if there are none.

## Output
Write `/tmp/bc_people/bio_out_<K>.json`, a JSON object keyed by person id:
```json
{"william-h-merrifield": {"role": "Partner in Ferris & Merrifield, managers of Roosevelt's Maltese Cross ranch",
  "bio": "…", "moments": [{"ref": "1886-02-04/a12", "label": "Married Jennie Macbeth at Mankato, Minn."}], "flags": []}}
```

Include every person in your input file. Validate that the JSON parses, that every id from the input is present, and that every `ref` appears in that person's excerpts. Keep scratch files in `/tmp/bc_people/bio_work_<K>/`. Other agents are working at the same time. Reply with only: K, the number of bios, and the number of flags.
