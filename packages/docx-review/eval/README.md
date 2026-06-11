# docx-review eval harness

Measures review quality with numbers, not assertions. Runs the real pipeline
against golden manuscripts with planted defects (and a clean control) and scores
**recall** (mustCatch defects caught) and **precision** (major/minor comments that
map to a real defect; on the clean control any major/minor comment is a false
positive).

## Layout

- `fixtures/<slug>.md` — manuscript as a reviewer sees it.
- `fixtures/<slug>.defects.json` — answer key: `defects[]` with `locationSnippet`,
  `description`, `category`, `severity`, `mustCatch`; the clean control has zero
  defects and a `cleanClaims[]` list of correct statements a reviewer must NOT flag.
- `runner/score.mjs` — pure scorer (unit-tested in `score.test.mjs`, offline).
- `runner/ctx.mjs`, `runner/ai.mjs` — real-AI boundary (needs provider keys).
- `run.mjs` — CLI. `gates.json` — regression thresholds. `reports/` — output.

## Run it (needs a provider key)

```bash
cd mim-apps
npm install                      # pulls ai + @ai-sdk/* (devDeps)
export ANTHROPIC_API_KEY=...     # or OPENAI_API_KEY / GOOGLE_API_KEY
npm run eval:docx -- --model claude-sonnet-4-6 --label before
# ... make changes ...
npm run eval:docx -- --model claude-sonnet-4-6 --label after
```

Flags: `--model`, `--judge-model` (held constant across A/B), `--no-judge`
(offline Tier-1 scoring), `--only slug1,slug2`, `--models <ai-models.json>`,
`--label`, `--out`. Exit 0 gates met / 1 gate missed / 2 authoring or setup error.

The scorer logic is CI-tested offline (`score.test.mjs`); the model calls run
manually with a key. Drop real anonymized trial reports into `fixtures/` (with a
`.defects.json` answer key) to extend the set.
