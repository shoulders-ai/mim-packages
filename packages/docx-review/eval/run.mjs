#!/usr/bin/env node
// docx-review eval runner. Runs the review pipeline (real AI) against the golden
// fixtures and scores recall/precision against their planted defects.
//
// Usage:
//   node packages/docx-review/eval/run.mjs --model claude-sonnet-4-6 [--judge-model claude-sonnet-4-6]
//        [--no-judge] [--only rct-manuscript,clean-control] [--label before]
//        [--models ../../shoulders-v0.3/resources/ai-models.json] [--out eval/reports/<ts>.json]
//
// Exit: 0 gates met, 1 gate missed, 2 authoring/setup error.
import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { jobs } from '../backend/index.mjs'
import { parseJsonObject } from '../backend/index.mjs'
import { makeEvalCtx } from './runner/ctx.mjs'
import { makeJudge } from './runner/ai.mjs'
import { scoreFixture, aggregate, checkGates, EvalAuthoringError } from './runner/score.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const PKG = dirname(HERE)
const FIXTURES = join(HERE, 'fixtures')

function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`)
  if (i === -1) return def
  const v = process.argv[i + 1]
  return v && !v.startsWith('--') ? v : true
}

async function main() {
  const noJudge = arg('no-judge', false) === true
  const label = arg('label', 'run')
  const only = typeof arg('only', '') === 'string' ? String(arg('only', '')).split(',').filter(Boolean) : []
  const modelsArg = arg('models', '')
  const registryPath = (typeof modelsArg === 'string' && modelsArg)
    ? resolve(process.cwd(), modelsArg)
    : resolve(PKG, '../../../shoulders-v0.3/resources/ai-models.json')
  if (!existsSync(registryPath)) fail(`registry not found at ${registryPath} (pass --models <path to ai-models.json>)`, 2)
  const registry = JSON.parse(readFileSync(registryPath, 'utf-8'))
  const model = String(arg('model', (registry.defaults?.agent || [])[0] || 'claude-sonnet-4-6'))
  const judgeModel = String(arg('judge-model', 'claude-sonnet-4-6'))

  const judge = noJudge ? null : makeJudge({ registry, judgeModel, parseJsonObject })

  const slugs = readdirSync(FIXTURES)
    .filter(f => f.endsWith('.md'))
    .map(f => basename(f, '.md'))
    .filter(s => existsSync(join(FIXTURES, `${s}.defects.json`)))
    .filter(s => !only.length || only.includes(s))

  if (!slugs.length) fail('no fixtures found', 2)

  const scores = []
  for (const slug of slugs) {
    const markdown = readFileSync(join(FIXTURES, `${slug}.md`), 'utf-8')
    const defectsSpec = JSON.parse(readFileSync(join(FIXTURES, `${slug}.defects.json`), 'utf-8'))
    process.stderr.write(`running ${slug} on ${model}...\n`)
    const { ctx } = makeEvalCtx({ markdown, registry })
    let result
    try {
      result = await jobs.reviewDocx.run(ctx, { path: `eval/${slug}.docx`, modelId: model })
    } catch (err) {
      result = { status: 'failed', reason: err?.message || String(err), comments: [] }
    }
    try {
      const fs = await scoreFixture({
        slug, defectsSpec, markdown, comments: result.comments || [], judge,
        options: { noJudge, model, judgeModel, status: result.status, failReason: result.reason },
      })
      scores.push(fs)
      process.stderr.write(`  ${slug}: recall=${fs.recall.toFixed(2)} precision=${fs.precision == null ? '—' : fs.precision.toFixed(2)} fp=${fs.falsePositives}\n`)
    } catch (err) {
      if (err instanceof EvalAuthoringError) fail(err.message, 2)
      throw err
    }
  }

  const agg = aggregate(scores)
  const gates = JSON.parse(readFileSync(join(HERE, 'gates.json'), 'utf-8'))
  const gate = checkGates(agg, gates)
  const report = {
    schemaVersion: 1, label, model, judgeModel: noJudge ? null : judgeModel,
    registryVersion: registry.version, config: { noJudge }, aggregate: agg, fixtures: scores,
  }
  const outDir = join(HERE, 'reports')
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })
  const out = typeof arg('out', '') === 'string' && arg('out', '') ? String(arg('out')) : join(outDir, `${label}.json`)
  writeFileSync(out, JSON.stringify(report, null, 2))

  printSummary(report, gate)
  process.stderr.write(`report: ${out}\n`)
  process.exit(gate.passed ? 0 : 1)
}

function printSummary(report, gate) {
  const a = report.aggregate
  console.log(`\ndocx-review eval — model=${report.model} judge=${report.judgeModel || 'off'} label=${report.label}`)
  console.log('fixture'.padEnd(24) + 'status'.padEnd(11) + 'recall'.padEnd(9) + 'prec'.padEnd(8) + 'must'.padEnd(6) + 'caught'.padEnd(8) + 'fp')
  for (const f of report.fixtures) {
    console.log(
      f.slug.padEnd(24) + String(f.status).padEnd(11) +
      (f.clean ? '—'.padEnd(9) : f.recall.toFixed(2).padEnd(9)) +
      (f.precision == null ? '—'.padEnd(8) : f.precision.toFixed(2).padEnd(8)) +
      String(f.mustCatchTotal).padEnd(6) + String(f.mustCatchCaught).padEnd(8) + String(f.falsePositives))
  }
  console.log('-'.repeat(70))
  console.log('AGGREGATE'.padEnd(24) + ''.padEnd(11) + a.recall.toFixed(2).padEnd(9) + a.precision.toFixed(2).padEnd(8) + String(a.mustCatchTotal).padEnd(6) + String(a.mustCatchCaught).padEnd(8) + String(a.falsePositives))
  const cats = Object.entries(a.perCategory).filter(([k]) => k !== '_unmatched').map(([k, v]) => `${k} ${v.recall.toFixed(2)}`)
  console.log('per-category recall: ' + cats.join('  '))
  console.log(`clean-control FP: ${a.cleanControl.falsePositives} (on clean claims: ${a.cleanControl.falsePositivesOnCleanClaims})`)
  console.log(`GATES: ${gate.passed ? 'PASS' : 'FAIL'}${gate.failures.length ? ' — ' + gate.failures.join('; ') : ''}  -> exit ${gate.passed ? 0 : 1}`)
}

function fail(msg, code) {
  process.stderr.write(`eval error: ${msg}\n`)
  process.exit(code)
}

main().catch(err => { process.stderr.write(`eval crashed: ${err?.stack || err}\n`); process.exit(2) })
