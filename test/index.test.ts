import { createExecutionContext, waitOnExecutionContext } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'

import worker from '../src'

describe('worker shell', () => {
  it('returns ok for GET /', async () => {
    const request = new Request('http://example.com/')
    const ctx = createExecutionContext()

    const response = await worker.fetch(request, { VAULT_ALLOWLIST: 'vault-a' }, ctx)

    await waitOnExecutionContext(ctx)

    expect(response.status).toBe(200)
    expect(await response.text()).toBe('ok')
  })

  it('returns the framework default response for POST /', async () => {
    const request = new Request('http://example.com/', { method: 'POST' })
    const ctx = createExecutionContext()

    const response = await worker.fetch(request, { VAULT_ALLOWLIST: 'vault-a' }, ctx)

    await waitOnExecutionContext(ctx)

    expect(response.status).toBe(404)
    expect(response.headers.get('content-type')).toBe('text/plain; charset=UTF-8')
    expect(await response.text()).toBe('404 Not Found')
  })
})
