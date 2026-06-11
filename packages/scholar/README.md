# Scholar

Reproducible literature search across public academic databases.

Run a research question through PubMed, Europe PMC, ClinicalTrials.gov, arXiv, and optionally OpenAlex or Semantic Scholar. The app builds a deduplicated candidate set from real API responses (never AI-fabricated), screens by abstract, and produces a brief answer with a full audit trail (`search.json`, `candidates.json`, `results.bib`).

**Tools:** `litsearch.search`, `litsearch.lookup`, `litsearch.citations`
