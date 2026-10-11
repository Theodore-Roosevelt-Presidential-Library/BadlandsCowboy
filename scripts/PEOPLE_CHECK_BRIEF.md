# Bad Lands Cow Boy: bio fact-check brief

You are an independent checker. Bios of people named in *The Bad Lands Cow Boy* (1884–86) were written by another AI from excerpts. They go on a public site of the Theodore Roosevelt Presidential Library. Check them against the full transcribed items.

## Input
- `/home/claude/bc/source/people/people.json`: `people[]` with `id`, `name`, `bio`, `role`, `moments[{ref,label}]` and `mentions` (a list of `[issue_date, article_id]`).
- Full item text: `/home/claude/bc/source/transcriptions/<issue_date>.json` → `articles[]` where `id == article_id` → `text`.

Check the people whose ids are listed in `/tmp/bc_people/check_<K>.txt`.

## For each person
1. Read the bio sentence by sentence, and the `role` and every moment `label`.
2. For each claim, find the item(s) that support it. Watch dates closely: an item in the issue of Thursday January 28, 1886 reports January events, not February ones. Watch names, numbers, places and who did what.
3. Fix anything wrong or unsupported by rewriting as little as possible. Remove any claim you cannot support. Keep the style: plain, past tense, no speculation. Don't add new material, except to correct an error.

## Output
Write `/tmp/bc_people/check_out_<K>.json`, an object keyed by id. Include **only** people you changed:
`{"id": {"bio": "corrected bio", "role": "…", "moments": [...], "changes": ["what was wrong and why, with the item ref"]}}`
Keep the unchanged fields the same as the input. Validate that the JSON parses. Keep scratch files in `/tmp/bc_people/check_work_<K>/`. Reply with only: K, the number checked, the number changed, and the most serious error found.
