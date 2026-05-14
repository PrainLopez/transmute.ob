import { createExecutionContext, waitOnExecutionContext } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'

import worker from '../src'

describe('GET /open', () => {
  it('returns handoff HTML for a valid open request', async () => {
    const request = new Request('http://example.com/open?vault=Vault&file=Notes/Today.md')
    const ctx = createExecutionContext()

    const response = await worker.fetch(request, { VAULT_ALLOWLIST: 'Vault' }, ctx)

    await waitOnExecutionContext(ctx)

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
    expect(response.headers.get('cache-control')).toBe('no-store')

    const html = await response.text()

    expect(html).toContain('location.href')
    expect(html).toContain('obsidian://open?vault=Vault&file=Notes%2FToday.md')
    expect(html).toContain('<a href="obsidian://open?vault=Vault&file=Notes%2FToday.md">Open in Obsidian</a>')
  })

  it('rejects extra query params', async () => {
    const request = new Request('http://example.com/open?vault=Vault&file=Notes/Today.md&heading=Foo')
    const ctx = createExecutionContext()

    const response = await worker.fetch(request, { VAULT_ALLOWLIST: 'Vault' }, ctx)

    await waitOnExecutionContext(ctx)

    expect(response.status).toBe(400)
    expect(await response.text()).toBe('Bad Request')
  })

  it('rejects missing, empty, and duplicate query params', async () => {
    const cases = [
      'http://example.com/open?vault=Vault',
      'http://example.com/open?file=Notes/Today.md',
      'http://example.com/open?vault=&file=Notes/Today.md',
      'http://example.com/open?vault=Vault&file=',
      'http://example.com/open?vault=Vault&vault=Other&file=Notes/Today.md',
      'http://example.com/open?vault=Vault&file=Notes/Today.md&file=Notes/Tomorrow.md',
    ]

    for (const url of cases) {
      const ctx = createExecutionContext()
      const response = await worker.fetch(new Request(url), { VAULT_ALLOWLIST: 'Vault' }, ctx)

      await waitOnExecutionContext(ctx)

      expect(response.status).toBe(400)
      expect(await response.text()).toBe('Bad Request')
    }
  })

  it('rejects vaults outside the allowlist', async () => {
    const request = new Request('http://example.com/open?vault=Other&file=Notes/Today.md')
    const ctx = createExecutionContext()

    const response = await worker.fetch(request, { VAULT_ALLOWLIST: 'Vault' }, ctx)

    await waitOnExecutionContext(ctx)

    expect(response.status).toBe(403)
    expect(response.headers.get('content-type')).toContain('application/json')
    expect(await response.text()).toBe('{"error":"forbidden_vault"}')
  })

  it('rejects absolute file paths after allowlist check', async () => {
    const request = new Request('http://example.com/open?vault=Vault&file=/Notes/Today.md')
    const ctx = createExecutionContext()

    const response = await worker.fetch(request, { VAULT_ALLOWLIST: 'Vault' }, ctx)

    await waitOnExecutionContext(ctx)

    expect(response.status).toBe(400)
    expect(await response.text()).toBe('Bad Request')
  })

  it('still rejects disallowed vaults when the file path is absolute', async () => {
    const request = new Request('http://example.com/open?vault=Other&file=/Notes/Today.md')
    const ctx = createExecutionContext()

    const response = await worker.fetch(request, { VAULT_ALLOWLIST: 'Vault' }, ctx)

    await waitOnExecutionContext(ctx)

    expect(response.status).toBe(403)
    expect(await response.text()).toBe('{"error":"forbidden_vault"}')
  })
})
