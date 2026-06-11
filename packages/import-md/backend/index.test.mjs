import { describe, expect, it, vi } from 'vitest'
import { jobs, tools } from './index.mjs'

function createCtx(result = {}) {
  const records = new Map()
  return {
    job: { runId: 'run-import-1' },
    tools: {
      call: vi.fn(async (name, params) => ({
        sourcePath: params.path,
        outputPath: params.output_path ?? 'imports/source.md',
        format: 'docx',
        fidelity: 'clean',
        warnings: [],
        stats: { characters: 1200 },
        ...result,
      })),
    },
    progress: {
      step: vi.fn(async () => {}),
      log: vi.fn(async () => {}),
      done: vi.fn(async () => {}),
    },
    data: {
      collection: vi.fn(() => ({
        put: vi.fn(async (key, value) => records.set(key, value)),
      })),
    },
    records,
  }
}

describe('import-md package backend', () => {
  it('runs the import job through the trusted document importer', async () => {
    const ctx = createCtx()

    const result = await jobs.importMarkdown.run(ctx, {
      path: 'inputs/report.docx',
      output_path: 'imports/report.md',
      max_rows: 50,
    })

    expect(ctx.tools.call).toHaveBeenCalledWith('documents.importMarkdown', {
      path: 'inputs/report.docx',
      output_path: 'imports/report.md',
      max_rows: 50,
    })
    expect(ctx.progress.step).toHaveBeenCalledWith('Reading source')
    expect(ctx.progress.done).toHaveBeenCalledWith({ outputPath: 'imports/report.md', fidelity: 'clean' })
    expect(ctx.records.get('run-import-1')).toMatchObject({
      sourcePath: 'inputs/report.docx',
      outputPath: 'imports/report.md',
      format: 'docx',
      fidelity: 'clean',
    })
    expect(result.outputPath).toBe('imports/report.md')
    expect(result.outputs).toEqual([
      {
        kind: 'markdown',
        label: 'Markdown file',
        path: 'imports/report.md',
        description: 'AI-ready Markdown created from the source document.',
        action: 'Open Markdown',
        openWith: 'editor',
      },
    ])
  })

  it('logs warning count when the core importer reports warnings', async () => {
    const ctx = createCtx({ warnings: ['Complex table fallback'] })

    await jobs.importMarkdown.run(ctx, { path: 'inputs/workbook.xlsx' })

    expect(ctx.progress.log).toHaveBeenCalledWith('1 import warnings')
  })

  it('exposes a chat-facing package tool that delegates to the same core tool', async () => {
    const ctx = createCtx()

    await tools.importToMarkdown.execute(ctx, {
      path: 'inputs/paper.pdf',
      max_pages: 12,
    })

    expect(ctx.tools.call).toHaveBeenCalledWith('documents.importMarkdown', {
      path: 'inputs/paper.pdf',
      max_pages: 12,
    })
  })

  it('requires a source path', async () => {
    const ctx = createCtx()

    await expect(jobs.importMarkdown.run(ctx, {})).rejects.toThrow('Missing required input: path')
  })
})
