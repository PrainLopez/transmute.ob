import { createExecutionContext, waitOnExecutionContext } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'

import worker from '../src'

describe('route fallthrough', () => {
  it('returns the framework default response for HEAD /open', async () => {
    const request = new Request('http://example.com/open?vault=Vault&file=Notes/Today.md', {
      method: 'HEAD',
    })
    const ctx = createExecutionContext()

    const response = await worker.fetch(request, { VAULT_ALLOWLIST: 'Vault' }, ctx)

    await waitOnExecutionContext(ctx)

    expect(response.status).toBe(404)
    expect(response.headers.get('content-type')).toBe('text/plain; charset=UTF-8')
    expect(await response.text()).toBe('')
  })

  it('returns the framework default response for POST /open', async () => {
    const request = new Request('http://example.com/open', { method: 'POST' })
    const ctx = createExecutionContext()

    const response = await worker.fetch(request, { VAULT_ALLOWLIST: 'Vault' }, ctx)

    await waitOnExecutionContext(ctx)

    expect(response.status).toBe(404)
    expect(response.headers.get('content-type')).toBe('text/plain; charset=UTF-8')
    expect(await response.text()).toBe('404 Not Found')
  })

  it('returns the framework default response for POST /transmute', async () => {
    const request = new Request('http://example.com/transmute', { method: 'POST' })
    const ctx = createExecutionContext()

    const response = await worker.fetch(request, { VAULT_ALLOWLIST: 'Vault' }, ctx)

    await waitOnExecutionContext(ctx)

    expect(response.status).toBe(404)
    expect(response.headers.get('content-type')).toBe('text/plain; charset=UTF-8')
    expect(await response.text()).toBe('404 Not Found')
  })
})
