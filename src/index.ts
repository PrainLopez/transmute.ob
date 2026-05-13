import { createApp, type AppBindings } from './app'

export default {
  fetch(request: Request, env: AppBindings, ctx: ExecutionContext) {
    return createApp(env).fetch(request, env, ctx)
  },
}
