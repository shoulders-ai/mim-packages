function importInputs(input = {}) {
  const path = typeof input.path === 'string' ? input.path.trim() : ''
  if (!path) throw new Error('Missing required input: path')
  const outputPath = typeof input.output_path === 'string' && input.output_path.trim()
    ? input.output_path.trim()
    : undefined
  return {
    path,
    ...(outputPath ? { output_path: outputPath } : {}),
    ...(typeof input.max_rows === 'number' ? { max_rows: input.max_rows } : {}),
    ...(typeof input.max_cols === 'number' ? { max_cols: input.max_cols } : {}),
    ...(typeof input.max_pages === 'number' ? { max_pages: input.max_pages } : {}),
  }
}

async function runImport(ctx, input) {
  const params = importInputs(input)
  await ctx.progress.step('Reading source')
  const result = await ctx.tools.call('documents.importMarkdown', params)
  const output = withOutputDescriptor(result)
  await ctx.progress.step('Writing Markdown')
  await ctx.data.collection('imports').put(ctx.job?.runId ?? `${Date.now()}`, {
    sourcePath: output.sourcePath,
    outputPath: output.outputPath,
    format: output.format,
    fidelity: output.fidelity,
    warnings: output.warnings,
    stats: output.stats,
    importedAt: new Date().toISOString(),
  })
  if (Array.isArray(output.warnings) && output.warnings.length > 0) {
    await ctx.progress.log(`${output.warnings.length} import warnings`)
  }
  await ctx.progress.done({ outputPath: output.outputPath, fidelity: output.fidelity })
  return output
}

function withOutputDescriptor(result) {
  if (!result || typeof result !== 'object' || typeof result.outputPath !== 'string') return result
  return {
    ...result,
    outputs: [
      {
        kind: 'markdown',
        label: 'Markdown file',
        path: result.outputPath,
        description: 'AI-ready Markdown created from the source document.',
        action: 'Open Markdown',
        openWith: 'editor'
      }
    ]
  }
}

const importSchema = {
  type: 'object',
  properties: {
    path: { type: 'string' },
    output_path: { type: 'string' },
    max_rows: { type: 'number' },
    max_cols: { type: 'number' },
    max_pages: { type: 'number' }
  },
  required: ['path']
}

export const jobs = {
  importMarkdown: {
    label: 'Import to Markdown',
    inputSchema: importSchema,
    concurrency: 'parallel',
    async run(ctx, input) {
      return runImport(ctx, input)
    }
  }
}

export const tools = {
  importToMarkdown: {
    label: 'Import to Markdown',
    description: 'Convert a workspace .docx, .xlsx/.xlsm, .bib, or selectable .pdf file into AI-ready Markdown.',
    inputSchema: importSchema,
    audience: ['chat'],
    async execute(ctx, input) {
      return ctx.tools.call('documents.importMarkdown', importInputs(input))
    }
  }
}
