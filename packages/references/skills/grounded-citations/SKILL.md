---
name: grounded-citations
description: Use project references safely when drafting or reviewing cited research prose.
tools: [references.search, references.get, references.add]
unlocks: [references.search, references.get, references.add]
---

# Grounded Citations

Use this skill whenever you write, revise, or verify prose that contains academic citations.

Rules:

- Cite only keys returned by `references.search` or already visible in the active document's resolved bibliography.
- Do not invent citation keys, author names, years, titles, DOIs, or source claims.
- When a source is needed but not in the library, search for a real identifier or DOI and call `references.add`; cite the returned key only after the tool succeeds.
- If a claim cannot be grounded in a library source, say that it needs a source instead of filling in a plausible citation.
- Use `references.get` when checking a specific citation, DOI, title, attached PDF path, or provenance detail.
- Prefer citations that directly support the sentence. Do not use a vaguely related source as a placeholder.

When drafting, keep citations in Pandoc form: `[@key]` for a sentence-level citation or `[@a; @b]` for grouped support.
