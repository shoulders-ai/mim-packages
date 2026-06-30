import { createHash } from 'node:crypto'
import { existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'

const DB_RELATIVE_PATH = ['.mim', 'knowledge.sqlite']

function hashEntry(entry) {
  return createHash('sha256').update(JSON.stringify({
    id: entry.id,
    type: entry.type,
    title: entry.title,
    summary: entry.summary,
    tags: entry.tags || [],
    links: entry.links || [],
    extra: entry.extra || {},
    created: entry.created,
    updated: entry.updated,
    body: entry.body || '',
  })).digest('hex')
}

async function workspacePath(ctx) {
  const info = await ctx.tools.call('workspace.info', {})
  if (!info?.open || typeof info.path !== 'string' || !info.path) {
    throw new Error('No workspace is open')
  }
  return info.path
}

async function databasePath(ctx) {
  const root = await workspacePath(ctx)
  return join(root, ...DB_RELATIVE_PATH)
}

async function openDatabase(ctx) {
  const { DatabaseSync } = await import('node:sqlite')
  const path = await databasePath(ctx)
  mkdirSync(dirname(path), { recursive: true })
  return new DatabaseSync(path)
}

async function openExistingDatabase(ctx) {
  const { DatabaseSync } = await import('node:sqlite')
  const path = await databasePath(ctx)
  if (!existsSync(path)) return null
  return new DatabaseSync(path, { readOnly: true })
}

function createSchema(db) {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS nodes (
      id      TEXT PRIMARY KEY,
      type    TEXT NOT NULL DEFAULT 'note',
      title   TEXT NOT NULL DEFAULT '',
      summary TEXT NOT NULL DEFAULT '',
      body    TEXT DEFAULT '',
      extra   TEXT DEFAULT '{}',
      created TEXT NOT NULL DEFAULT '',
      updated TEXT NOT NULL DEFAULT '',
      hash    TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS labels (
      node_id TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
      label   TEXT NOT NULL,
      PRIMARY KEY (node_id, label)
    );

    CREATE TABLE IF NOT EXISTS edges (
      source  TEXT NOT NULL,
      target  TEXT NOT NULL,
      rel     TEXT NOT NULL,
      PRIMARY KEY (source, target, rel)
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS search USING fts5(id UNINDEXED, title, summary, body);

    CREATE INDEX IF NOT EXISTS idx_labels ON labels(label);
    CREATE INDEX IF NOT EXISTS idx_edges_target ON edges(target);
    CREATE INDEX IF NOT EXISTS idx_nodes_type ON nodes(type);
  `)
}

export async function rebuildKnowledgeIndex(ctx, entries = []) {
  let db
  try {
    db = await openDatabase(ctx)
    createSchema(db)

    const currentIds = new Set(entries.map(entry => entry.id))
    const existing = new Map(db.prepare('SELECT id, hash FROM nodes').all().map(row => [row.id, row.hash]))

    const deleteNode = db.prepare('DELETE FROM nodes WHERE id = ?')
    const deleteLabels = db.prepare('DELETE FROM labels WHERE node_id = ?')
    const deleteEdges = db.prepare('DELETE FROM edges WHERE source = ?')
    const upsertNode = db.prepare(`
      INSERT INTO nodes (id, type, title, summary, body, extra, created, updated, hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        type = excluded.type,
        title = excluded.title,
        summary = excluded.summary,
        body = excluded.body,
        extra = excluded.extra,
        created = excluded.created,
        updated = excluded.updated,
        hash = excluded.hash
    `)
    const insertLabel = db.prepare('INSERT OR IGNORE INTO labels (node_id, label) VALUES (?, ?)')
    const insertEdge = db.prepare('INSERT OR IGNORE INTO edges (source, target, rel) VALUES (?, ?, ?)')
    const clearSearch = db.prepare('DELETE FROM search')
    const insertSearch = db.prepare('INSERT INTO search (id, title, summary, body) VALUES (?, ?, ?, ?)')

    db.exec('BEGIN')
    try {
      for (const id of existing.keys()) {
        if (!currentIds.has(id)) {
          deleteLabels.run(id)
          deleteEdges.run(id)
          deleteNode.run(id)
        }
      }

      for (const entry of entries) {
        const hash = hashEntry(entry)
        if (existing.get(entry.id) !== hash) {
          upsertNode.run(
            entry.id,
            entry.type || 'note',
            entry.title || '',
            entry.summary || '',
            entry.body || '',
            JSON.stringify(entry.extra || {}),
            entry.created || '',
            entry.updated || '',
            hash,
          )
          deleteLabels.run(entry.id)
          deleteEdges.run(entry.id)
          for (const tag of entry.tags || []) insertLabel.run(entry.id, String(tag))
          for (const link of entry.links || []) insertEdge.run(entry.id, link.target, link.rel)
        }
      }

      clearSearch.run()
      for (const entry of entries) {
        insertSearch.run(entry.id, entry.title || '', entry.summary || '', entry.body || '')
      }
      db.exec('COMMIT')
    } catch (err) {
      db.exec('ROLLBACK')
      throw err
    }

    return { ok: true, indexed: entries.length, path: DB_RELATIVE_PATH.join('/') }
  } catch (err) {
    return { ok: false, error: err?.message ? String(err.message) : String(err) }
  } finally {
    if (db) db.close()
  }
}

export async function upsertKnowledgeIndex(ctx, entry) {
  let db
  try {
    db = await openDatabase(ctx)
    createSchema(db)
    upsertEntry(db, entry)
    return { ok: true, indexed: 1, path: DB_RELATIVE_PATH.join('/') }
  } catch (err) {
    return { ok: false, error: err?.message ? String(err.message) : String(err) }
  } finally {
    if (db) db.close()
  }
}

export async function deleteKnowledgeIndex(ctx, id) {
  let db
  try {
    db = await openDatabase(ctx)
    createSchema(db)
    deleteEntry(db, id)
    return { ok: true, deleted: id, path: DB_RELATIVE_PATH.join('/') }
  } catch (err) {
    return { ok: false, error: err?.message ? String(err.message) : String(err) }
  } finally {
    if (db) db.close()
  }
}

export async function listKnowledgeIndex(ctx, ids = []) {
  if (!Array.isArray(ids) || ids.length === 0) return { ok: true, items: [] }

  let db
  try {
    db = await openExistingDatabase(ctx)
    if (!db) return { ok: false, error: 'knowledge index does not exist' }

    const placeholders = ids.map(() => '?').join(', ')
    const rows = db.prepare(`
      SELECT id, type, title, summary, extra, created, updated
      FROM nodes
      WHERE id IN (${placeholders})
    `).all(...ids)

    const tags = db.prepare('SELECT label FROM labels WHERE node_id = ? ORDER BY label')
    const links = db.prepare('SELECT rel, target FROM edges WHERE source = ? ORDER BY rel, target')
    const byId = new Map(rows.map(row => [row.id, {
      id: row.id,
      type: row.type || 'note',
      title: row.title || '',
      summary: row.summary || '',
      tags: tags.all(row.id).map(tag => tag.label),
      links: links.all(row.id).map(link => ({ rel: link.rel, target: link.target })),
      extra: parseExtra(row.extra),
      created: row.created || '',
      updated: row.updated || '',
    }]))

    return {
      ok: true,
      items: ids.map(id => byId.get(id)).filter(Boolean),
    }
  } catch (err) {
    return { ok: false, error: err?.message ? String(err.message) : String(err) }
  } finally {
    if (db) db.close()
  }
}

function upsertEntry(db, entry) {
  const upsertNode = db.prepare(`
    INSERT INTO nodes (id, type, title, summary, body, extra, created, updated, hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      type = excluded.type,
      title = excluded.title,
      summary = excluded.summary,
      body = excluded.body,
      extra = excluded.extra,
      created = excluded.created,
      updated = excluded.updated,
      hash = excluded.hash
  `)
  const deleteLabels = db.prepare('DELETE FROM labels WHERE node_id = ?')
  const deleteEdges = db.prepare('DELETE FROM edges WHERE source = ?')
  const insertLabel = db.prepare('INSERT OR IGNORE INTO labels (node_id, label) VALUES (?, ?)')
  const insertEdge = db.prepare('INSERT OR IGNORE INTO edges (source, target, rel) VALUES (?, ?, ?)')
  const deleteSearch = db.prepare('DELETE FROM search WHERE id = ?')
  const insertSearch = db.prepare('INSERT INTO search (id, title, summary, body) VALUES (?, ?, ?, ?)')

  db.exec('BEGIN')
  try {
    upsertNode.run(
      entry.id,
      entry.type || 'note',
      entry.title || '',
      entry.summary || '',
      entry.body || '',
      JSON.stringify(entry.extra || {}),
      entry.created || '',
      entry.updated || '',
      hashEntry(entry),
    )
    deleteLabels.run(entry.id)
    deleteEdges.run(entry.id)
    for (const tag of entry.tags || []) insertLabel.run(entry.id, String(tag))
    for (const link of entry.links || []) insertEdge.run(entry.id, link.target, link.rel)
    deleteSearch.run(entry.id)
    insertSearch.run(entry.id, entry.title || '', entry.summary || '', entry.body || '')
    db.exec('COMMIT')
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }
}

function deleteEntry(db, id) {
  const deleteLabels = db.prepare('DELETE FROM labels WHERE node_id = ?')
  const deleteEdges = db.prepare('DELETE FROM edges WHERE source = ?')
  const deleteNode = db.prepare('DELETE FROM nodes WHERE id = ?')
  const deleteSearch = db.prepare('DELETE FROM search WHERE id = ?')

  db.exec('BEGIN')
  try {
    deleteLabels.run(id)
    deleteEdges.run(id)
    deleteSearch.run(id)
    deleteNode.run(id)
    db.exec('COMMIT')
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }
}

function ftsQuery(query) {
  const terms = String(query || '').toLowerCase().match(/[a-z0-9]+/g) || []
  return terms.map(term => `${term}*`).join(' ')
}

export async function searchKnowledgeIndex(ctx, query, limit = 25) {
  const match = ftsQuery(query)
  if (!match) return { ok: true, items: [] }

  let db
  try {
    db = await openDatabase(ctx)
    createSchema(db)
    const rows = db.prepare(`
      SELECT n.id, n.type, n.title, n.summary, n.created, n.updated, n.extra
      FROM search
      JOIN nodes n ON n.id = search.id
      WHERE search MATCH ?
      ORDER BY bm25(search)
      LIMIT ?
    `).all(match, limit)

    const tags = db.prepare('SELECT label FROM labels WHERE node_id = ? ORDER BY label')
    const links = db.prepare('SELECT rel, target FROM edges WHERE source = ? ORDER BY rel, target')
    return {
      ok: true,
      items: rows.map(row => ({
        id: row.id,
        type: row.type || 'note',
        title: row.title || '',
        summary: row.summary || '',
        tags: tags.all(row.id).map(tag => tag.label),
        links: links.all(row.id).map(link => ({ rel: link.rel, target: link.target })),
        extra: parseExtra(row.extra),
        created: row.created || '',
        updated: row.updated || '',
      })),
    }
  } catch (err) {
    return { ok: false, error: err?.message ? String(err.message) : String(err) }
  } finally {
    if (db) db.close()
  }
}

function parseExtra(raw) {
  try {
    const parsed = JSON.parse(raw || '{}')
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}
