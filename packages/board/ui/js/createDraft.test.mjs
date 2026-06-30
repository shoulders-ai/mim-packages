import { describe, expect, it } from 'vitest'
import { makeNewIssueDraft } from './createDraft.js'
import { renderCreateModal } from './createView.js'

describe('Board create modal draft contracts', () => {
  it('keeps draft title and description in the rendered modal after a rerender', () => {
    const draft = {
      ...makeNewIssueDraft({ status: 'plan', project: 'launch', userName: 'Ada' }),
      title: 'Keep typed title',
      body: 'Keep typed description',
    }

    const html = renderCreateModal({
      modalOpen: true,
      userName: 'Ada',
      createMore: true,
      newIssue: draft,
    })

    expect(html).toContain('id="createTitle"')
    expect(html).toContain('Keep typed title')
    expect(html).toContain('id="createBody"')
    expect(html).toContain('Keep typed description')
    expect(html).toContain('create-more-toggle on')
  })

  it('keeps the first-run name prompt value in the rendered modal after a rerender', () => {
    const draft = {
      ...makeNewIssueDraft(),
      nameInput: 'Ada',
      title: 'Keep typed title',
    }

    const html = renderCreateModal({
      modalOpen: true,
      userName: '',
      createMore: false,
      newIssue: draft,
    })

    expect(html).toContain('id="nameInput"')
    expect(html).toContain('value="Ada"')
    expect(html).toContain('Keep typed title')
  })

  it('renders the draft description as an editable field', () => {
    const html = renderCreateModal({
      modalOpen: true,
      userName: 'Ada',
      createMore: false,
      newIssue: makeNewIssueDraft({ userName: 'Ada' }),
    })

    expect(html).toContain('<textarea class="create-desc" id="createBody"')
    expect(html).toContain('placeholder="Add description..."')
  })

  it('escapes draft text instead of rendering it as controls', () => {
    const html = renderCreateModal({
      modalOpen: true,
      userName: '<img src=x>',
      createMore: false,
      newIssue: {
        ...makeNewIssueDraft({ userName: '<img src=x>' }),
        title: '<button data-action="new-issue">bad</button>',
        body: '</textarea><button data-action="new-issue">bad</button>',
      },
    })

    expect(html).toContain('&lt;button data-action=&quot;new-issue&quot;&gt;bad&lt;/button&gt;')
    expect(html).toContain('&lt;/textarea&gt;&lt;button data-action=&quot;new-issue&quot;&gt;bad&lt;/button&gt;')
    expect(html).not.toContain('<button data-action="new-issue">bad</button>')
  })
})
