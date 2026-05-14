import { Hono } from 'hono'

import { validateOpenRequest } from './request-validator'
import { renderOpenPage } from './render-open-page'
import { renderTransmutePage } from './render-transmute-page'
import { resolveVaultAllowlist } from './vault-allowlist'

export interface AppBindings {
  VAULT_ALLOWLIST?: string
}

export function createApp(bindings: AppBindings) {
  void bindings.VAULT_ALLOWLIST

  const app = new Hono<{ Bindings: AppBindings }>()

  app.all('/', (c) => {
    if (c.req.method !== 'GET') {
      return c.notFound()
    }

    return c.text('ok')
  })

  app.all('/open', (c) => {
    if (c.req.method !== 'GET') {
      return c.notFound()
    }

    const allowedVaults = new Set(resolveVaultAllowlist(c.env))
    const validated = validateOpenRequest(new URL(c.req.url), allowedVaults)

    if (validated instanceof Response) {
      return validated
    }

    return new Response(renderOpenPage(validated), {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  })

  app.all('/transmute', (c) => {
    if (c.req.method !== 'GET') {
      return c.notFound()
    }

    return new Response(renderTransmutePage(), {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  })

  return app
}
