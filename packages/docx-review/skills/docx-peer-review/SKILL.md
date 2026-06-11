# DOCX Peer Review

Use this skill when the user wants an academic or research manuscript reviewed in Word format.

Workflow:

1. Confirm the target file is a workspace-relative `.docx` path.
2. Start the `reviewDocx` package job through the package tool.
3. Tell the user the run id immediately. The job is asynchronous.
4. When the run completes, report the generated markdown report path and reviewed DOCX path.

The job reads the manuscript, runs a gatekeeper, runs technical/editorial/reference review agents, validates exact text anchors, writes a markdown summary, and creates a reviewed Word copy with native comment balloons. The original DOCX is never modified.

Use the minimal job input:

```json
{
  "path": "manuscript.docx"
}
```

If the user explicitly chooses a review model, include `modelId`. Any configured
provider with tool support works (Anthropic, OpenAI, Google); pick a large-context
model such as Gemini for very long documents.

If the user gives review directions, constraints, focus areas, or context,
include them as `reviewNotes`. These notes are passed to the technical,
editorial, reference, and report-writing agents.

Do not ask the user to upload the same document again if the file is already in the workspace.
