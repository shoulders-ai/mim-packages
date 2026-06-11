const KNOWLEDGE_DIR = 'knowledge'
const KNOWLEDGE_ID_RE = /^knowledge-\d+-[a-z0-9]{4}$/
const KNOWLEDGE_RECENT_LIMIT = 5

const fieldsSchema = {
  title: { type: 'string' },
  tags: { type: 'array', items: { type: 'string' } },
  body: { type: 'string' },
}

function objectSchema(properties, required = []) {
  return { type: 'object', properties, required }
}

function rand4(rand) {
  const n = Math.floor(rand() * 0x10000) & 0xffff
  return n.toString(16).padStart(4, '0')
}

export function newKnowledgeId(now = Date.now, rand = Math.random) {
  return `knowledge-${Math.floor(now() / 1000)}-${rand4(rand)}`
}

function splitFrontmatter(raw) {
  if (!raw.startsWith('---')) return { fm: null, body: raw }
  const rest = raw.slice(3)
  const nl = rest.indexOf('\n')
  if (nl === -1) return { fm: null, body: raw }
  const afterOpen = rest.slice(nl + 1)
  const closeMatch = afterOpen.match(/\n?---[ \t]*(\r?\n|$)/)
  if (!closeMatch || closeMatch.index === undefined) return { fm: null, body: raw }
  const fm = afterOpen.slice(0, closeMatch.index)
  const body = afterOpen.slice(closeMatch.index + closeMatch[0].length)
  return { fm, body }
}

function parseFrontmatter(text) {
  const meta = {}
  const lines = String(text || '').split(/\r?\n/)
  for (let i = 0; i < lines.length;) {
    const line = lines[i]
    const match = /^([A-Za-z_][A-Za-z0-9_-]*):(.*)$/.exec(line)
    if (!match) {
      i += 1
      continue
    }
    const key = match[1]
    const value = match[2].trim()
    if (value !== '') {
      meta[key] = parseScalar(value)
      i += 1
      continue
    }
    const block = []
    i += 1
    while (i < lines.length && /^[ \t]+/.test(lines[i])) {
      block.push(lines[i])
      i += 1
    }
    meta[key] = parseYamlListBlock(block)
  }
  return meta
}

function parseYamlListBlock(lines) {
  const out = []
  for (const raw of lines) {
    const line = raw.trim()
    if (!line.startsWith('- ')) continue
    out.push(parseScalar(line.slice(2).trim()))
  }
  return out
}

function parseScalar(value) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try { return JSON.parse(trimmed) } catch { return trimmed.slice(1, -1) }
  }
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1).replace(/''/g, "'")
  }
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) return parsed
    } catch {
      return trimmed.slice(1, -1).split(',').map(part => parseScalar(part)).filter(Boolean)
    }
  }
  return trimmed
}

function yamlScalar(value) {
  return JSON.stringify(String(value ?? ''))
}

function coerceTags(value) {
  if (Array.isArray(value)) return value.map(String)
  if (typeof value === 'string') {
    return value.split(',').map(t => t.trim()).filter(Boolean)
  }
  return []
}

export function parseKnowledge(id, raw) {
  const { fm, body } = splitFrontmatter(String(raw ?? ''))
  let meta = {}
  try {
    meta = fm === null ? {} : parseFrontmatter(fm)
  } catch {
    meta = {}
  }
  return {
    id,
    title: typeof meta.title === 'string' ? meta.title : '',
    tags: coerceTags(meta.tags),
    created: typeof meta.created === 'string' ? meta.created : '',
    updated: typeof meta.updated === 'string' ? meta.updated : '',
    body,
  }
}

export function serializeKnowledge(entry) {
  const lines = [`title: ${yamlScalar(entry.title)}`]
  if (Array.isArray(entry.tags) && entry.tags.length > 0) {
    lines.push('tags:')
    for (const tag of entry.tags) lines.push(`  - ${yamlScalar(tag)}`)
  }
  lines.push(`created: ${yamlScalar(entry.created)}`)
  lines.push(`updated: ${yamlScalar(entry.updated)}`)
  return `---\n${lines.join('\n')}\n---\n${entry.body ?? ''}`
}

async function folderPresent(ctx) {
  const result = await ctx.tools.call('fs.exists', { path: KNOWLEDGE_DIR })
  return result?.exists === true
}

async function readKnowledgeFile(ctx, id) {
  const result = await ctx.tools.call('fs.read', { path: `${KNOWLEDGE_DIR}/${id}.md`, full: true })
  if (!result || typeof result.content !== 'string') throw new Error(`Knowledge entry not found: ${id}`)
  return parseKnowledge(id, result.content)
}

export async function listKnowledge(ctx) {
  if (!await folderPresent(ctx)) return { items: [], folderPresent: false }
  const result = await ctx.tools.call('fs.list', { path: KNOWLEDGE_DIR, max_entries: 1000 })
  const entries = Array.isArray(result?.entries) ? result.entries : []
  const items = []
  for (const entry of entries) {
    if (!entry || entry.type !== 'file' || typeof entry.path !== 'string') continue
    if (!entry.path.endsWith('.md')) continue
    const id = entry.path.split('/').pop().replace(/\.md$/, '')
    try {
      const full = await readKnowledgeFile(ctx, id)
      const { body, ...summary } = full
      void body
      items.push(summary)
    } catch {
      // Skip unreadable/corrupt files.
    }
  }
  return { items, folderPresent: true }
}

export async function getKnowledge(ctx, input) {
  return readKnowledgeFile(ctx, requireId(input))
}

export async function createKnowledge(ctx, input = {}) {
  if (!await folderPresent(ctx)) return { folderPresent: false }
  validateTitle(input)
  const timestamp = new Date().toISOString()
  const entry = {
    id: '',
    title: input.title,
    tags: Array.isArray(input.tags) ? input.tags : [],
    created: timestamp,
    updated: timestamp,
    body: typeof input.body === 'string' ? input.body : '',
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    entry.id = newKnowledgeId()
    const path = `${KNOWLEDGE_DIR}/${entry.id}.md`
    const exists = await ctx.tools.call('fs.exists', { path })
    if (exists?.exists === true) continue
    try {
      await ctx.tools.call('fs.create', { path, content: serializeKnowledge(entry) })
      return entry
    } catch (err) {
      if (attempt < 4 && String(err?.message ?? err).includes('already exists')) continue
      throw err
    }
  }
  throw new Error('Could not allocate a unique knowledge id')
}

export async function updateKnowledge(ctx, input = {}) {
  if (!await folderPresent(ctx)) return { folderPresent: false }
  const id = requireId(input)
  const existing = await readKnowledgeFile(ctx, id)
  const patch = { ...input }
  delete patch.id
  const merged = { ...existing, ...patch, id: existing.id, created: existing.created }
  validateTitle(merged)
  merged.updated = new Date().toISOString()
  await ctx.tools.call('fs.write', { path: `${KNOWLEDGE_DIR}/${id}.md`, content: serializeKnowledge(merged) })
  return merged
}

export async function deleteKnowledge(ctx, input = {}) {
  if (!await folderPresent(ctx)) return { folderPresent: false }
  const id = requireId(input)
  const path = `${KNOWLEDGE_DIR}/${id}.md`
  const exists = await ctx.tools.call('fs.exists', { path })
  if (exists?.exists === true) await ctx.tools.call('fs.delete', { path })
  return { ok: true }
}

function requireId(input) {
  if (!input || typeof input.id !== 'string' || input.id.length === 0) throw new Error('Missing required parameter: id')
  if (!KNOWLEDGE_ID_RE.test(input.id)) throw new Error(`Invalid knowledge id: ${input.id}`)
  return input.id
}

function validateTitle(input) {
  if (typeof input.title !== 'string' || input.title.trim() === '') throw new Error('title is required')
}

function titleOf(title) {
  return typeof title === 'string' && title.trim() ? title.trim() : '(untitled)'
}

export async function knowledgeAgentContext(ctx) {
  const { items } = await listKnowledge(ctx)
  if (items.length === 0) return { title: 'Knowledge', body: 'No knowledge entries yet.' }
  const recent = [...items]
    .sort((a, b) => b.id.localeCompare(a.id))
    .slice(0, KNOWLEDGE_RECENT_LIMIT)
  const lines = [`${items.length} entries. Recent:`]
  for (const entry of recent) lines.push(`- ${titleOf(entry.title)}`)
  return { title: 'Knowledge', body: lines.join('\n') }
}

export const tools = {
  list: {
    name: 'knowledge.list',
    label: 'List knowledge',
    description: 'List knowledge entry summaries from knowledge/. Returns {items, folderPresent}; bodies are omitted.',
    inputSchema: objectSchema({}),
    audience: ['chat'],
    execute: listKnowledge,
  },
  get: {
    name: 'knowledge.get',
    label: 'Get knowledge',
    description: 'Get one full knowledge entry including its body.',
    inputSchema: objectSchema({ id: { type: 'string' } }, ['id']),
    audience: ['chat'],
    execute: getKnowledge,
  },
  create: {
    name: 'knowledge.create',
    label: 'Create knowledge',
    description: 'Create a new knowledge markdown file in knowledge/.',
    inputSchema: objectSchema(fieldsSchema, ['title']),
    audience: ['chat'],
    execute: createKnowledge,
  },
  update: {
    name: 'knowledge.update',
    label: 'Update knowledge',
    description: 'Update fields on an existing knowledge markdown file.',
    inputSchema: objectSchema({ id: { type: 'string' }, ...fieldsSchema }, ['id']),
    audience: ['chat'],
    execute: updateKnowledge,
  },
  delete: {
    name: 'knowledge.delete',
    label: 'Delete knowledge',
    description: 'Delete a knowledge markdown file from knowledge/.',
    inputSchema: objectSchema({ id: { type: 'string' } }, ['id']),
    audience: ['chat'],
    execute: deleteKnowledge,
  },
}

export const agentContext = knowledgeAgentContext
