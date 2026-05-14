# Tranmute.ob

Cloudflare Workers 后端，用来提供一个稳定的本地 Obsidian 打开入口，以及一个浏览器侧的反向转换页面。

## Dos and Don'ts

这个服务运行在 Cloudflare Workers 上，使用 Hono 作为路由层，入口是 Worker 风格的 `fetch()`，核心应用工厂在 `src/app.ts`。

项目采用字符串模板直接渲染 HTML，不使用 JSX。业务逻辑拆在深层模块里，主要包括：

- `src/request-validator.ts`：校验 `/open` 请求
- `src/vault-allowlist.ts`：解析 `VAULT_ALLOWLIST`
- `src/render-open-page.ts`：渲染 Obsidian 跳转页
- `src/render-transmute-page.ts`：渲染浏览器侧转换页
- `src/json-response.ts`：输出 JSON 错误

## User Manual

### `/`

健康检查，返回纯文本 `ok`。

### `/open?vault=...&file=...`

这是公开的 Obsidian 打开入口。

- 只接受且必须包含 `vault` 和 `file`
- 拒绝缺失、空值、重复参数或额外参数
- 只允许 `VAULT_ALLOWLIST` 中的 vault
- 拒绝以 `/` 开头的 `file`
- 成功时返回最小 HTML，并用 `location.href` 打开 `obsidian://open?...`
- 同时保留可见的备用链接
- 成功响应带 `Cache-Control: no-store`

不允许的 vault 会返回 `403`，正文为 `{"error":"forbidden_vault"}`。

### `/transmute`

这是浏览器侧转换页。

- 粘贴一个 `obsidian://open?vault=...&file=...` 链接
- 页面会在浏览器里解析并转成当前 origin 下的 `http://.../open?vault=...&file=...`
- 提供复制按钮、返回链接、复制失败提示和校验错误
- 只支持页面内转换，没有 `POST /transmute`
- 成功响应带 `Cache-Control: no-store`

页面内的错误码是：`invalid_url`、`unsupported_protocol`、`missing_vault`、`missing_file`、`invalid_query`。

## 配置

唯一运行时配置是 `VAULT_ALLOWLIST`。

- 格式：逗号分隔字符串
- 规则：会 trim、去空、去重
- 匹配：大小写敏感，精确匹配
- 如果缺失或为空，`/open` 会失败关闭

示例：

```txt
VAULT_ALLOWLIST=Vault One,Vault Two
```

在 Cloudflare Workers 里，这个值作为请求绑定从 `env` 注入，应用会在每次请求时读取它；测试里也会直接把它作为请求环境传入。

## 本地开发

安装依赖：

```bash
bun install
```

启动本地开发：

```bash
bun run dev
```

这会运行 `wrangler dev`。

如果你要本地验证 `/open`，记得同时提供 `VAULT_ALLOWLIST`。

## 测试

```bash
bun run test
```

测试使用 `vitest run` 和 `@cloudflare/vitest-pool-workers`。

## 部署

```bash
bun run deploy
```

这会运行 `wrangler deploy --minify`。

部署到 Workers 时，也要配置 `VAULT_ALLOWLIST`，否则 `/open` 会拒绝访问。

## 类型生成

```bash
bun run cf-typegen
```

这会运行 `wrangler types --env-interface CloudflareBindings`。
