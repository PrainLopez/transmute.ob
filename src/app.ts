import { Hono } from 'hono'

export interface AppBindings {
  VAULT_ALLOWLIST?: string
}

export function createApp(bindings: AppBindings) {
  void bindings.VAULT_ALLOWLIST

  const app = new Hono<{ Bindings: AppBindings }>()

  app.get('/', (c) => {
    return c.text('ok')
  })

  return app
}
