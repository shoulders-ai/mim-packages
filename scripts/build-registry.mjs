#!/usr/bin/env node
//
// Generates index.json from packages/*/package.json + external.json.
// Run: node scripts/build-registry.mjs
//
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const REPO = 'https://github.com/shoulders-ai/mim-apps'
const REGISTRY_FIELDS = ['id', 'name', 'description', 'permissions', 'engines']

const commit = execSync('git rev-parse HEAD', { cwd: ROOT }).toString().trim()

// --- In-repo packages ---------------------------------------------------

const pkgDir = join(ROOT, 'packages')
const localEntries = []

for (const name of readdirSync(pkgDir).sort()) {
  const pkgJsonPath = join(pkgDir, name, 'package.json')
  try { statSync(pkgJsonPath) } catch { continue }

  const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf8'))
  const mim = pkg.mim
  if (!mim?.id) {
    console.warn(`SKIP packages/${name}: no mim.id in package.json`)
    continue
  }

  const entry = {}
  for (const key of REGISTRY_FIELDS) {
    if (mim[key] !== undefined) entry[key] = mim[key]
  }
  entry.repo = REPO
  entry.path = `packages/${name}`
  entry.version = pkg.version
  entry.ref = commit
  entry.commit = commit

  localEntries.push(entry)
}

// --- External packages ---------------------------------------------------

let externalEntries = []
try {
  externalEntries = JSON.parse(readFileSync(join(ROOT, 'external.json'), 'utf8'))
  if (!Array.isArray(externalEntries)) {
    console.error('external.json must be a JSON array')
    process.exit(1)
  }
} catch (err) {
  if (err.code !== 'ENOENT') throw err
}

// Check for id collisions
const localIds = new Set(localEntries.map(e => e.id))
for (const ext of externalEntries) {
  if (localIds.has(ext.id)) {
    console.error(`CONFLICT: external entry "${ext.id}" collides with in-repo package`)
    process.exit(1)
  }
}

// --- Write ---------------------------------------------------------------

const index = {
  manifestVersion: 1,
  packages: [...localEntries, ...externalEntries],
}

const out = JSON.stringify(index, null, 2) + '\n'
writeFileSync(join(ROOT, 'index.json'), out)
console.log(`index.json: ${localEntries.length} local + ${externalEntries.length} external = ${index.packages.length} packages`)
