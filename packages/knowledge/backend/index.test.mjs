import { describe, expect, it } from 'vitest'
import {
  createKnowledge,
  deleteKnowledge,
  getKnowledge,
  knowledgeAgentContext,
  listKnowledge,
  parseKnowledge,
  serializeKnowledge,
  tools,
  updateKnowledge,
} from './index.mjs'

function createCtx(files = {}) {
  const store = new Map(Object.entries(files))
  const calls = []
  return {
    calls,
    files: store,
    tools: {
      async call(name, params = {}) {
        calls.push([name, params])
        switch (name) {
          case 'fs.exists':
            return { exists: params.path === 'knowledge' ? hasKnowledgeFolder(store) : store.has(params.path) }
          case 'fs.list':
            if (!hasKnowledgeFolder(store)) throw new Error('Path does not exist: knowledge')
            return {
              entries: [...store.keys()]
                .filter(path => path.startsWith('knowledge/'))
                .map(path => ({ name: path.split('/').pop(), path, type: 'file' })),
              truncated: false,
            }
          case 'fs.read':
            if (!store.has(params.path)) throw new Error(`File not found: ${params.path}`)
            return { content: store.get(params.path), truncated: false }
          case 'fs.create':
            if (store.has(params.path)) throw new Error(`File already exists: ${params.path}`)
            store.set(params.path, params.content)
            return { created: params.path }
          case 'fs.write':
            store.set(params.path, params.content)
            return { written: params.path }
          case 'fs.delete':
            store.delete(params.path)
            return { deleted: params.path }
          default:
            throw new Error(`Unexpected tool call: ${name}`)
        }
      },
    },
  }
}

function hasKnowledgeFolder(store) {
  return [...store.keys()].some(path => path.startsWith('knowledge/'))
}

describe('knowledge package model', () => {
  it('round-trips a full entry', () => {
    const entry = {
      id: 'knowledge-1700000000-ab12',
      title: 'How deploys work',
      tags: ['ops', 'deploy'],
      created: '2026-05-01T10:00:00.000Z',
      updated: '2026-05-02T10:00:00.000Z',
      body: 'Steps:\n\n1. Build\n2. Ship',
    }
    expect(parseKnowledge(entry.id, serializeKnowledge(entry))).toEqual(entry)
  })

  it('tolerates missing frontmatter and csv/list tags', () => {
    expect(parseKnowledge('knowledge-1700000000-ab12', 'just body').body).toBe('just body')
    expect(parseKnowledge('knowledge-1700000000-ab12', '---\ntitle: T\ntags: ops, deploy, q2\n---\nb').tags)
      .toEqual(['ops', 'deploy', 'q2'])
    expect(parseKnowledge('knowledge-1700000000-ab12', '---\ntitle: T\ntags:\n  - ops\n  - deploy\n---\nb').tags)
      .toEqual(['ops', 'deploy'])
  })
})

describe('knowledge package tools', () => {
  it('declares named public tool descriptors', () => {
    expect(Object.values(tools).map(tool => tool.name).sort()).toEqual([
      'knowledge.create',
      'knowledge.delete',
      'knowledge.get',
      'knowledge.list',
      'knowledge.update',
    ])
    for (const tool of Object.values(tools)) {
      expect(tool.inputSchema).toBeDefined()
    }
  })

  it('list returns folderPresent:false without creating knowledge/', async () => {
    const ctx = createCtx()
    await expect(listKnowledge(ctx)).resolves.toEqual({ items: [], folderPresent: false })
    expect(ctx.files.size).toBe(0)
  })

  it('create reports folderPresent:false when app.enable has not created the data folder', async () => {
    const ctx = createCtx()
    await expect(createKnowledge(ctx, { title: 'X' })).resolves.toEqual({ folderPresent: false })
  })

  it('create/get/list/update/delete round-trips through fs.* tools', async () => {
    const ctx = createCtx({ 'knowledge/.keep': '' })
    const created = await createKnowledge(ctx, { title: 'Doc', tags: ['x'], body: 'hi' })
    expect(created.id).toMatch(/^knowledge-\d+-[a-z0-9]{4}$/)
    expect(ctx.files.has(`knowledge/${created.id}.md`)).toBe(true)

    const got = await getKnowledge(ctx, { id: created.id })
    expect(got.title).toBe('Doc')
    expect(got.body).toBe('hi')

    const listed = await listKnowledge(ctx)
    expect(listed.folderPresent).toBe(true)
    expect(listed.items.length).toBe(1)
    expect(listed.items[0].body).toBeUndefined()

    const updated = await updateKnowledge(ctx, { id: created.id, title: 'Doc 2' })
    expect(updated.title).toBe('Doc 2')
    expect(updated.created).toBe(created.created)

    const deleted = await deleteKnowledge(ctx, { id: created.id })
    expect(deleted).toEqual({ ok: true })
    expect(ctx.files.has(`knowledge/${created.id}.md`)).toBe(false)
  })

  it('agentContext summarizes recent entries', async () => {
    const entry = serializeKnowledge({
      id: 'knowledge-1700000000-ab12',
      title: 'Deploy notes',
      tags: [],
      created: '2026-06-01T00:00:00.000Z',
      updated: '2026-06-01T00:00:00.000Z',
      body: '',
    })
    const ctx = createCtx({ 'knowledge/knowledge-1700000000-ab12.md': entry })
    const section = await knowledgeAgentContext(ctx)
    expect(section.title).toBe('Knowledge')
    expect(section.body).toContain('1 entries. Recent:')
    expect(section.body).toContain('- Deploy notes')
  })
})
