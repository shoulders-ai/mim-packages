// Eval ctx factory: the same boundary shape backend/index.test.mjs uses, but with
// the real AI caller swapped in and extract returning the fixture markdown
// directly (no .docx, no C# worker). annotate records ops instead of writing.
import { makeRealAi } from './ai.mjs'

export function markdownToLooseHtml(markdown) {
  return String(markdown || '')
    .split(/\n{2,}/)
    .map(block => {
      const h = block.match(/^(#{1,6})\s+(.*)$/)
      if (h) { const n = h[1].length; return `<h${n}>${escapeHtml(h[2])}</h${n}>` }
      return `<p>${escapeHtml(block)}</p>`
    })
    .join('')
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function makeEvalCtx({ markdown, html, registry, runId = 'eval0000-0000-0000' }) {
  const log = { annotateOps: [], ai: [], puts: [] }
  const ctx = {
    job: { runId },
    ai: makeRealAi({ registry, log }),
    progress: { step: async () => {}, progress: async () => {}, done: async () => {} },
    data: { collection: () => ({ put: async (k, v) => { log.puts.push({ k, v }) } }) },
    documents: {
      docx: {
        workerStatus: async () => ({ available: true }),
        extract: async () => ({ markdown, html: html ?? markdownToLooseHtml(markdown), images: [] }),
        annotate: async (_sourcePath, operations) => {
          log.annotateOps.push(...operations)
          return { success: true, results: operations.map(() => ({ success: true })) }
        },
      },
    },
    tools: {
      call: async (name) => {
        if (name === 'ai.registry') return registry
        if (name === 'fs.write') return { ok: true }
        return {}
      },
    },
  }
  return { ctx, log }
}
