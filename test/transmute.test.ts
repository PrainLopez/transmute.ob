import { createExecutionContext, waitOnExecutionContext } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'

import worker from '../src'

describe('worker transmute page', () => {
  it('returns the browser-side conversion page', async () => {
    const request = new Request('http://example.com/transmute')
    const ctx = createExecutionContext()

    const response = await worker.fetch(request, { VAULT_ALLOWLIST: 'vault-a' }, ctx)

    await waitOnExecutionContext(ctx)

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
    expect(response.headers.get('cache-control')).toBe('no-store')

    const html = await response.text()

    expect(html).toContain('<form id="transmute-form">')
    expect(html).toContain('id="paste"')
    expect(html).toContain('name="url"')
    expect(html).toContain('id="convert"')
    expect(html).toContain('id="source"')
    expect(html).toContain('id="result"')
    expect(html).toContain('id="copy"')
    expect(html).toContain('id="copy-failure"')
    expect(html).toContain('id="error"')
    expect(html).toContain('Back')
    expect(html).toContain('window.location.origin + "/open?vault="')
    expect(html).toContain('navigator.clipboard.writeText')
    expect(html).toContain('copy.dataset.url = openUrl')
    expect(html).toContain('copyFailure.hidden = false')
    expect(html).toContain('invalid_url')
    expect(html).toContain('unsupported_protocol')
    expect(html).toContain('missing_vault')
    expect(html).toContain('missing_file')
    expect(html).toContain('invalid_query')
  })
})
