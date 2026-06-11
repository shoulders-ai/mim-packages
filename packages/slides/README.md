# Slides Package

Importable Mim package for generating slide decks as paginated HTML and exporting PDF.

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

**Generate** a deck from a brief — include style, tone, and length wishes in the brief text. Attach workspace files (sources, templates, examples, assets) through the built-in file picker. The agent plans slides, writes paginated HTML, renders to PDF, and runs a vision design critique.

**Refine** an existing deck. After generation, use the refine bar in the result view to iterate: change individual slides, restyle, add charts, or restructure. Each refinement reads the current deck, applies targeted edits, re-renders, and runs a single-round design critique.

For a GitHub-backed workspace, prefer the workspace install and commit the
copied `packages/slides/` directory in that workspace repo. That keeps the
Slides app versioned with the customer workflow. Keep this
`example-packages/slides/` directory as the canonical template source; do not
move it into `~/mim-workspace` unless that directory is the workspace repo that
should own an installed copy.
