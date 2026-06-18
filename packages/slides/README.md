# Slides Package

Importable Mim package for drafting slide decks as paginated HTML and exporting PDF.

This package is intentionally outside the root `packages/` directory, so Mim does not load it as a bundled app. Install it by copying the folder into a package discovery directory:

```bash
mkdir -p "$WORKSPACE/packages"
cp -R example-packages/slides "$WORKSPACE/packages/slides"
```

For a global install:

```bash
mkdir -p ~/.mim/packages
cp -R example-packages/slides ~/.mim/packages/slides
```

After copying, restart or rescan packages in Mim. The copy must include the `shared/` directory (charts and model utilities used by the backend). The package depends on the core `render.htmlToPdf` tool, which is provided by the desktop app.

## Usage

**Generate** a deck from a brief — include style, tone, and length wishes in the brief text. Attach workspace files (sources, templates, examples, assets) through the built-in file picker. The backend gives the model a fixed PowerPoint-geometry HTML template, writes the returned deck to normal workspace files, and renders PDF once. It does not run an automatic repair loop or vision critique.

**Refine** an existing deck. After generation, use the refine bar in the result view to apply one instruction to the current `deck.html`; the backend writes the updated HTML and renders PDF once. Further iteration can happen through the editor, chat agent file edits, or another refine run.

Generated decks are ordinary workspace files:

```text
slides/<slug>-<run>/
  brief.md
  deck.html
  deck.pdf
  deck-plan.json
```

For a GitHub-backed workspace, prefer the workspace install and commit the
copied `packages/slides/` directory in that workspace repo. That keeps the
Slides app versioned with the customer workflow. Keep this
`example-packages/slides/` directory as the canonical template source; do not
move it into `~/mim-workspace` unless that directory is the workspace repo that
should own an installed copy.
