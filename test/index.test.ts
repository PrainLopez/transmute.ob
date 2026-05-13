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
})
