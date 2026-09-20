# Bruno — API Testing Reference

Source: [docs.usebruno.com](https://docs.usebruno.com) (read 2026-09-20). Full doc index: `https://docs.usebruno.com/llms.txt`.

Reference for the tool. For how this repo actually uses it, see `bruno/README.md` and section 19.

---

## 1. What Bruno is

Git-friendly, offline-first API client. Collections are plain text files on disk, versioned with the code they test. No account required, no cloud workspace, no sync service.

| | Bruno | Postman |
|---|---|---|
| Storage | files in your repo (`.yml` / `.bru`) | cloud workspace |
| Git | native — real diffs, real merges | export/import JSON blob |
| Offline | always | partial |
| Account | not required | required |
| CLI | `@usebruno/cli` (`bru run`) | `newman` |
| Price | GUI open source; Pro/Ultimate unlock Git write + unlimited OpenAPI sync | seat-based SaaS |

Protocols: REST, GraphQL, gRPC, WebSocket, SOAP, SSE.

---

## 2. Install

```bash
# Desktop app: https://www.usebruno.com/downloads  (v3.x recommended)

# CLI
npm install -g @usebruno/cli
# or per-project
npm install --save-dev @usebruno/cli
```

Also available: VS Code extension, Docker image.

Requires Node.js. Git needed for the collaboration features.

---

## 3. Collection layout

Two on-disk formats. **YAML is the recommended default since Bruno 3.0.0**; `.bru` is the legacy DSL and still fully supported. Both can coexist; drag-and-drop between collections converts single requests automatically (folders must be moved manually).

### YAML (OpenCollection spec)

```
bruno/
  opencollection.yml          # collection root: name, vars, auth, collection-level scripts
  .env                        # process env secrets — gitignore this
  environments/
    dev.yml
    prod.yml
  student/
    folder.yml                # folder-level vars/scripts/docs
    list-loans.yml
    create-loan.yml
```

### .bru (legacy)

```
bruno/
  bruno.json                  # collection root
  collection.bru
  environments/dev.bru
  student/list-loans.bru
```

**OpenCollection** is Bruno's open, vendor-neutral spec for *executable* collections. Their framing: "OpenAPI tells you the shape of the door. OpenCollection shows you how to walk through it." OpenAPI = structural contract; OpenCollection = execution workflow.

---

## 4. File format reference

### 4.1 YAML request structure

Top-level sections: `info`, `http`, `runtime`, `settings`, `docs`.

| Section | Field | Type | Notes |
|---|---|---|---|
| `info` | `name` | string | display name |
| | `type` | string | `http` or `folder` |
| | `seq` | number | sort position |
| | `tags` | array | used by `--tags` CLI filter |
| `http` | `method` | string | GET/POST/PUT/PATCH/DELETE/OPTIONS/HEAD/TRACE/CONNECT |
| | `url` | string | supports `{{var}}` and `:pathParam` |
| | `params` | array | `{name, value, type: query\|path, disabled?, description?}` |
| | `headers` | array | `{name, value, disabled?, description?}` |
| | `body` | object | `{type, data}` |
| | `auth` | object | see 4.3 |
| `runtime` | `scripts` | array | `{type: before-request \| after-response \| tests, code}` |
| | `assertions` | array | `{expression, operator, value}` |
| `settings` | `encodeUrl` | boolean | |
| | `timeout` | number | ms, `0` = unlimited |
| | `followRedirects` | boolean | |
| | `maxRedirects` | number | |
| `docs` | — | markdown | per-request documentation |

Body types: `json`, `text`, `xml`, `form-urlencoded`, `multipart-form`, `graphql`.

### 4.2 YAML samples (verbatim from docs)

GET:

```yaml
info:
  name: Get User
  type: http
  seq: 1

http:
  method: GET
  url: https://api.github.com/users/usebruno

settings:
  encodeUrl: true
```

Headers + query params:

```yaml
info:
  name: Search Users
  type: http
  seq: 3

http:
  method: GET
  url: https://api.example.com/users?filter=active&limit=10&page=1
  headers:
    - name: Content-Type
      value: application/json
    - name: Authorization
      value: Bearer topsecret
  params:
    - name: filter
      value: active
      type: query
    - name: limit
      value: "10"
      type: query

settings:
  encodeUrl: true
  timeout: 0
  followRedirects: true
  maxRedirects: 5
```

Path param — declare it in the URL as `:id` and list it with `type: path`:

```yaml
http:
  method: GET
  url: https://api.example.com/users/:id
  params:
    - name: id
      value: ""
      type: path
```

POST + JSON body:

```yaml
info:
  name: Create User
  type: http
  seq: 5

http:
  method: POST
  url: https://api.example.com/users
  body:
    type: json
    data: |-
      {
        "name": "John Doe",
        "email": "john@example.com"
      }

settings:
  encodeUrl: true
```

Scripts (pre-request / post-response) and tests:

```yaml
info:
  name: Login with Tests
  type: http
  seq: 10

http:
  method: POST
  url: https://api.example.com/login
  body:
    type: json
    data: |-
      {
        "username": "johnnash",
        "password": "governingdynamics"
      }

runtime:
  scripts:
    - type: before-request
      code: |-
        bru.setVar("timestamp", Date.now());
    - type: after-response
      code: |-
        bru.setVar("token", res.body.token);
    - type: tests
      code: |-
        test("should be able to login", function() {
          expect(res.status).to.equal(201);
        });

        test("should receive the token", function() {
          expect(res.body.token).to.be.a('string');
        });

settings:
  encodeUrl: true
```

Declarative assertions (no JS):

```yaml
runtime:
  assertions:
    - expression: res.status
      operator: eq
      value: "201"
    - expression: res.body.name
      operator: isString
```

### 4.3 Auth types

`none`, `inherit`, `basic`, `bearer`, `apikey`, `digest`, `oauth1`, `oauth2`, `awsv4`, `ntlm`, `wsse`. Plus Akamai EdgeGrid and client certs.

```yaml
http:
  auth:
    type: basic
    username: admin
    password: secret
```

OAuth2 supports authorization-code, client-credentials, password-credentials, and system-browser flows, configurable at collection level.

### 4.4 Bru markup language (legacy `.bru`)

Three block kinds:

**Dictionary** — key/value pairs. `~` prefix disables a key.

```
get {
  url: https://api.textlocal.in/send
}

headers {
  content-type: application/json
  Authorization: Bearer 123
  ~transaction-id: {{transactionId}}
}
```

**Text** — multi-line free content.

```
body {
  {
    "hello": "world"
  }
}

tests {
  expect(res.status).to.equal(200);
}
```

**Array** — comma-separated list; `~` disables an item.

```
vars:secret [
  access_key,
  access_secret,
  ~transactionId
]
```

Script blocks: `script:pre-request`, `script:post-response`, `tests`.

Migration path documented at `/bru-lang/yaml-migration`.

---

## 5. Variables

Seven scopes, plus process env.

| Scope | Stored in |
|---|---|
| Global environment | local storage |
| Environment | `environments/<name>.yml` |
| Collection | `opencollection.yml` |
| Folder | `folder.yml` |
| Request | `request.yml` |
| Runtime (session only) | memory / local storage |
| Prompt (`{{?Prompt String}}`) | interactive input at run time |
| Process env | `.env` at collection root |

**Precedence, highest first:** Runtime → Request → Folder → Environment → Collection → Global.

Interpolation is `{{name}}` everywhere — URL, headers, body, auth. Process env is `{{process.env.NAME}}`, bracket notation for dotted keys: `{{process.env['example.test']}}`.

Since v4.0.0 variables are typed: `string`, `number`, `boolean`, `object`. YAML uses type/data fields; `.bru` uses `@number`, `@boolean`, `@object` annotations. Env/collection/folder/global vars auto-persist to disk in v4.

Script accessor pattern: `bru.get<Scope>Var(key)` — `getEnvVar`, `getGlobalEnvVar`, `getCollectionVar`, `getFolderVar`, `getRequestVar`, `getVar` (runtime).

---

## 6. Secrets

Three approaches:

1. **Secret variables** — marked secret in the GUI, stored locally, "encrypted using OS level encryption when available or falls back to AES256 encryption." Never written into the shared collection file.
2. **DotEnv** — `.env` at the collection root, loaded automatically, read via `{{process.env.KEY}}`.
3. **Secret managers** — HashiCorp Vault, AWS Secrets Manager, Azure Key Vault, Google Secret Manager. Read in scripts with `bru.getSecretVar("secret-name.key-name")`. CLI passes provider credentials via `--secrets-env-file`.

`.env` rules: quote values containing `#`, newline, `"`, or `\`.

```bash
SIMPLE_KEY=mysecretvalue
DB_PASSWORD="P@ss#w0rd!123"
MULTILINE="line1\nline2"
WIN_PATH="C:\\Users\\name"
```

Always `.gitignore` the `.env`; commit a `.env.sample` with placeholder values instead. There is also secret masking in the UI/reports.

---

## 7. Assertions

Declarative, filled in the **Assert** tab: expression + operator + value.

**Expression targets**

- `res.status`
- `res.body.*`, nested (`res.body.user.profile.name`) and indexed (`res.body.users[0].name`)
- `res.headers['content-type']`
- `res.responseTime`
- `res('path.to.property')` — query function, supports wildcards (`..price`)

**Operators**

- Comparison — `equals`, `notEquals`, `gt`, `gte`, `lt`, `lte`
- String — `contains`, `notContains`, `startsWith`, `endsWith`, `matches`, `notMatches`
- Type — `isNull`, `isEmpty`, `isNotEmpty`, `isDefined`, `isUndefined`, `isNumber`, `isString`, `isBoolean`, `isArray`, `isJson`
- Boolean — `isTruthy`, `isFalsy`
- Collection — `in`, `notIn`, `between`, `length`

(The YAML `assertions` block uses short forms: `eq`, `neq`, `isString`, `isNumber`, …)

---

## 8. Tests and scripting

Tests use **Chai** `expect`:

```js
test("test description", function () {
  const data = res.getBody();
  expect(res.getStatus()).to.equal(200);
});
```

Script contexts: pre-request (mutate `req`, set vars, skip), post-response (read `res`, store, branch), tests (assert).

### JavaScript API — key surface

**`req`**
`getUrl()` / `setUrl()`, `getHost()`, `getPath()`, `getQueryString()`, `getMethod()` / `setMethod()`, `getPathParams()`, `getHeader(n)` / `setHeader(n,v)` / `getHeaders()` / `setHeaders(o)` / `deleteHeader(n)`, `headerList` (PropertyList), `getBody(opts?)` / `setBody(b)`, `setTimeout(ms)`, `setMaxRedirects(n)`, `getAuthMode()`, `getName()`, `getTags()`, `getExecutionMode()` (`"runner"` | `"standalone"`), `onFail(cb)` (Developer Mode only), `disableParsingResponseJson()`.

**`res`**
`status` / `getStatus()`, `statusText`, `headers` / `getHeaders()`, `headerList`, `body` / `getBody()`, `setBody(b)`, `responseTime`, `url`, `getSize()` → `{body, headers, total}`.

**`bru` — environment**
`getEnvName()`, `getEnvVar` / `setEnvVar` / `hasEnvVar` / `deleteEnvVar` / `deleteAllEnvVars` / `getAllEnvVars`; same set prefixed `Global` for the global environment.

**`bru` — variables**
`getVar` / `setVar` / `hasVar` / `deleteVar` / `deleteAllVars` / `getAllVars`; `getCollectionVar` / `setCollectionVar`; `getFolderVar`, `getRequestVar` (read-only); `getCollectionName()`; `getProcessEnv(key)`; `getSecretVar(key)`; `getOauth2CredentialVar(key)`, `resetOauth2Credential(id)`.

**`bru.runner` — flow control**
`setNextRequest(name)` (also `bru.setNextRequest`), `skipRequest()`, `stopExecution()`, `iterationData` (`.get()`, `.has()`, `.unset()`, `.stringify()`), `iterationIndex`, `totalIterations`.

**`bru` — utilities**
`await bru.sendRequest(options, cb?)`, `await bru.sleep(ms)`, `await bru.runRequest(pathName)`, `bru.interpolate(str)`, `bru.cwd()`, `bru.isSafeMode()`, `await bru.getTestResults()`, `await bru.getAssertionResults()` (each with `lhs`, `operator`, `rhs`, `status`).

**`bru.cookies`**
Sync reads: `get(name)`, `has(name[,value])`, `all()`, `toObject()`, `each/filter/map/reduce`.
Async writes: `await add(obj)`, `upsert(obj)`, `remove(name)`, `clear()`.
Jar for multiple URLs: `const jar = bru.cookies.jar()` → `setCookie(url,name,value)`, `getCookie(url,name)`, `hasCookie`, `deleteCookie`, `deleteCookies`, `clear`.

**PropertyList** (`req.headerList`, `res.headerList`): read `get/one/all/count`; search `has/find/filter/indexOf`; iterate `each/map/reduce`; transform `toObject/toString/toJSON`; write (req only) `add/upsert/remove/clear/populate/repopulate/assimilate`.

Also available: inbuilt libraries, external npm libraries (Developer Mode), `.js` file imports, dynamic variables (faker-style), request chaining, sync requests.

### Sandbox

| Mode | Allows | Default |
|---|---|---|
| **Safe** | sandboxed JS; no filesystem, no shell | yes (GUI and CLI since v3.0.0) |
| **Developer** | filesystem, system commands, external npm packages | opt-in |

Toggle via the shield icon top-right; CLI uses `--sandbox=developer`. Detect at runtime with `bru.isSafeMode()`. Only use Developer Mode on collections you authored or fully trust.

---

## 9. Cookies

Bruno keeps an automatic cookie jar: it saves and forwards cookies between requests in both the Collection Runner and the CLI, honouring `Set-Cookie` on 2XX, 4XX and 5XX responses. Attributes stored: domain, path, key, value, expiration, Secure, HttpOnly.

Domain/path/key are immutable after creation (security). Disable the jar with `--disable-cookies` on the CLI, or Preferences → General → "Store Cookies automatically" in the app.

This makes HTTP-only session-cookie auth work end-to-end without manual header juggling.

---

## 10. Data-driven runs

Feed the runner a CSV or JSON file; one iteration per row.

```csv
name,job
John Doe,Software Engineer
Jane Smith,Product Manager
```

```json
[
  { "name": "John Doe", "job": "Software Engineer" },
  { "name": "Jane Smith", "job": "Product Manager" }
]
```

Reference columns as `{{columnName}}` in URL, headers, or body.

```bash
bru run --csv-file-path ./data/loans.csv --reporter-html results.html
bru run --json-file-path ./data/loans.json
bru run --iteration-count 5
```

In scripts: `bru.runner.iterationData.get("name")`, `.has()`, `.unset()`, plus `iterationIndex` / `totalIterations`.

Gotcha from the docs: "The data file does not replace your request body" — a static body just runs N times; you must template it.

---

## 11. CLI (`bru`)

```bash
bru run                                   # whole collection, cwd = collection root
bru run request.bru                       # one request
bru run request1.bru request2.bru
bru run <folder>                          # one folder
bru run <folder> -r                       # recursive
bru run --env local
```

**Setup flags**

| Flag | Purpose |
|---|---|
| `--env [name]` | environment to run with |
| `--global-env [name]` | global / workspace-level environment |
| `--workspace-path [path]` | when the collection isn't at the workspace root |
| `--env-var k=v` | override one env var; repeatable |
| `--global-env-var k=v` | override one global env var; repeatable |
| `--env-file [path]` | env file (`.bru` or `.json`) for this run |
| `--sandbox [safe\|developer]` | JS execution mode; default `safe` (v3.0.0+) |
| `--csv-file-path` / `--json-file-path` | data-driven source |
| `--iteration-count [n]` | run the collection N times |
| `-r` | recursive run |

**Request flags**

| Flag | Purpose |
|---|---|
| `--delay [ms]` | delay between requests |
| `--tests-only` | only requests with tests or active assertions |
| `--bail` | stop on first request/test/assertion failure |
| `--tags a,b` | only requests having ALL these tags |
| `--exclude-tags a,b` | skip requests having ANY of these tags |
| `--parallel` | run **CSV iterations** in parallel — not requests (verified against `bru --help`, CLI 4.1.0; the docs page wording is misleading) |

**Security / network flags**

`--cacert [file]`, `--ignore-truststore`, `--client-cert-config [file]`, `--insecure`, `--disable-cookies`, `--noproxy`, `--secrets-env-file [file]`.

**Reporters**

| Format | Flag |
|---|---|
| JSON | `--reporter-json results.json` |
| JUnit | `--reporter-junit results.xml` |
| HTML | `--reporter-html results.html` |

Combine freely:

```bash
bru run --reporter-json results.json --reporter-junit results.xml --reporter-html results.html
```

Trim report payloads with `--reporter-skip-headers`, `--reporter-skip-all-headers`, `--reporter-skip-request-body`, `--reporter-skip-response-body`, `--reporter-skip-body`.
`-o/--output` and `-f/--format` are deprecated in favour of the reporter flags.

**Import subcommand**

```bash
bru import openapi --source ./openapi.yaml --output ./collections --collection-name "Petstore API"
```

Flags: `-s/--source` (path or URL), `-o/--output` (directory), `-f/--output-file` (single JSON export), `-n/--collection-name`, `--collection-format bru|opencollection`, `--insecure`, `-g/--group-by tags|path` (default `tags`).

Exit code is 0 on success, non-zero on any failure — that's the CI gate.

---

## 12. CI

Official action: `usebruno/bruno-cli-action@v1`. It installs the CLI, prepends `bru`, auto-injects `--reporter-junit` when no reporter is given (to `$RUNNER_TEMP/bruno-junit.xml`), parses the results, and exposes `exit-code`, `passed`, `failed`, `total`, `duration-ms` as step outputs.

```yaml
name: API Tests
on: [pull_request, push]

jobs:
  bruno:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6

      - uses: usebruno/bruno-cli-action@v1
        with:
          working-directory: tests/payments
          command: 'run --env prod'
```

Fuller version with tags, injected vars, and an uploaded HTML report:

```yaml
name: Bruno API Tests

on:
  pull_request:
    branches: [ main ]
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read

jobs:
  bruno-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6

      - run: mkdir -p reports

      - uses: usebruno/bruno-cli-action@v1
        with:
          working-directory: collections/bruno-automation-demo
          command: >
            run
            --global-env ci
            --workspace-path ../..
            --tags smoke,workflow,release-gate
            --env-var platform_name="GitHub Actions"
            --env-var build_id="${{ github.run_id }}"
            --env-var commit_sha="${{ github.sha }}"
            --reporter-html ../../reports/github-actions-report.html

      - uses: actions/upload-artifact@v6
        if: ${{ !cancelled() }}
        with:
          name: bruno-report
          path: reports/github-actions-report.html
          if-no-files-found: error
```

Inputs: `command` (required), `bru-version` (default `latest`), `working-directory` (default `.`). `@v1` floats; `@v1.2.3` pins.

Jenkins, Azure DevOps, GitLab CI, and Bitbucket Pipelines are supported by invoking `bru` directly or via the Docker image.

---

## 13. OpenAPI

- **Import** (`/open-api/importOAS`) — GUI file or URL, or `bru import openapi`. Supports OpenAPI 2.0 and 3.x, YAML or JSON. Group by `tags` (default) or `path` (`path` matches Postman's layout more closely). In BRU format spaces in tag names become underscores; OpenCollection YAML keeps the original names.
- **Export** (`/open-api/exportOAS`) and **create** (`/open-api/createOAS`) a spec from a collection.
- **Sync** (`/open-api/openapi-sync`, beta) — bind a collection to a spec URL/file and keep them aligned. Dashboard shows total endpoints, matched endpoints, local changes, pending spec updates. Polls every 5 min by default.
  - *Sync* reconciles while keeping your entered values: existing fields keep your data, new spec fields take spec defaults, removed fields drop.
  - *Reset* (per endpoint) replaces spec-derived fields wholesale.
  - Never tracked or overwritten: tests, scripts, assertions, request settings, auth values (only auth *mode* switches are flagged).
  - **Open Source edition is capped at 5 syncs/month**; unlimited needs Pro/Ultimate.

Converters also exist for Postman → Bruno, Insomnia → Bruno, OpenAPI → Bruno, WSDL → Bruno.

---

## 14. Mock servers (beta)

Enable in Preferences → Beta → Mock Server. Runs a local HTTP server backed by a collection's saved **response examples** or by an **OpenAPI spec**; clients point at `http://localhost:<port>`.

- Mocks live with the collection in version control.
- CORS on by default; any HTTP client works.
- Match on method + path with params; optional rules on headers, query params, or body.
- Auto or pinned port, optional global delay.
- Request Log keeps the last 500 entries per server — debugging only, not an audit trail.
- Mocks do not auto-start when Bruno restarts.

---

## 15. Documentation features

Two separate things:

**Write docs in Bruno** (`/api-docs/*`) — markdown at four levels: workspace, collection, folder, request. WYSIWYG toolbar (headings, bold, lists, tables, code blocks), toggle to raw markdown, syntax-highlighted code with language auto-detection, image/video embeds, one-click copy. All HTML in doc blocks is sanitized before render to prevent XSS.

**Generate HTML docs** (`/html-docs/*`) — a standalone, self-contained HTML site built from the collection: requests, params, headers, auth, scripts, tests, plus everything you wrote in markdown. Includes an interactive playground (edit + run, auto-generated cURL/Python/JavaScript samples), an environment switcher that resolves `{{vars}}`, and full-text search. Deploy anywhere static, or just email the file.

Output quality is bounded by how much markdown you actually wrote.

---

## 16. Git integration

Collections are files, so plain `git` works with zero Bruno involvement. On top of that there's a built-in Git GUI:

- **Free**: init, view diffs, check for updates, pull, clone.
- **Pro/Ultimate**: commit, push, branching, merge-conflict resolution.

Guides for GitHub, GitLab, Bitbucket, Azure DevOps. Strategies doc covers co-located (collection inside the app repo) vs dedicated repo. There's also a "Fetch in Bruno" embed button for READMEs.

---

## 17. AI

- **Bruno AI** — in-app assistant; configure OpenAI, Anthropic, or a custom provider.
- **AI integration** (`/ai/integration/*`) — because collections are plain text, coding agents can read and write them directly. Guides for Cursor, VS Code, Codex, Claude, Devin. The Claude guide is thin: drop a `.claude/CLAUDE.md` at the project root with instructions for working on the collection, or use Bruno's default instruction file from their GitHub. No MCP server documented.
- **Bruno Apps** — configurable in-app apps with their own API ref and examples.

---

## 18. Edition gates worth knowing

| Capability | Open source | Pro / Ultimate |
|---|---|---|
| GUI, CLI, all protocols, tests, CI | yes | yes |
| Git: init/diff/pull/clone | yes | yes |
| Git: commit/push/branch/merge | no | yes |
| OpenAPI sync | 5/month | unlimited |
| SAML SSO, SCIM provisioning, license portal, AI policy | no | yes (admin tier) |

No account needed to use Bruno; email is only collected to issue a license key on purchase.

---

## 19. How Me_Tang uses it

Set up. `bruno/` holds the collection, `npm run api:test` runs it. Full detail in
`bruno/README.md`; the shape and the reasons:

```
bruno/
  opencollection.yml
  environments/isolated.yml    # http://localhost:8081/api - the harness
  environments/local.yml       # http://localhost:8080/api - your dev server
  <13 tag folders>/            # imported from public/openapi.json
  Workflow/                    # hand-written ordered walk over the state machine
```

- **Generated from the spec.** `bru import openapi --source public/openapi.json
  --collection-format opencollection` produced all 33 requests. Re-importing overwrites every
  assertion, so it is a scratch-directory-and-diff operation, not a refresh.
- **Isolation, not care.** `scripts/api-test-isolated.mjs` runs the suite against a throwaway
  `postgres:17` container, so mutations write freely and every run starts from the same seed.
  All 13 migrations apply to the plain image — no Supabase-specific SQL anywhere.
- **Auth is free locally.** `DEV_API_BYPASS` + `DEV_AS_*` (`lib/development-access.ts`) skip the
  Entra round trip. The harness sets them for its own child process only.
- **Envelope and role-scope assertions** catch what source-text tests cannot: `data` present /
  `error` absent, and `bankAccountNo` absent for advisor and executive but present for admin —
  the explicit-`select` rule from `db/queries/loan-requests.ts`, checked on the wire.
- **Concurrency.** `Workflow/13` fires two simultaneous admin decisions with `bru.sendRequest`
  inside a `tests` script and asserts exactly one 200 and one 409. Note this cannot use
  `--parallel`, which only parallelises CSV iterations.
- **Money is `Int` baht.** The seeded ledger balance is asserted as exactly `95750`.
- **It found a real bug on its first run.** A student with an open loan got 500 instead of the
  documented 409: `lib/prisma-errors.ts` read `error.meta.target`, which Prisma 7's pg driver
  adapter no longer populates, so the `one_open_loan_per_student` mapping was dead code. The
  source-text test covering that mapping passed the whole time.

---

## 20. Source index

Top-level doc sections, all under `https://docs.usebruno.com/`:

`introduction/*` · `get-started/bruno-basics/*` · `get-started/import-export-data/*` · `get-started/configure/*` · `api-client/overview` · `send-requests/REST|graphql|grpc|websocket|soap/*` · `send-requests/res-data-cookies/*` · `variables/*` · `auth/*` · `secrets-management/*` (+ `secret-managers/{hashicorp-vault,aws-secrets-manager,azure-key-vault,google-secret-manager}/*`) · `testing/tests/*` · `testing/automate-test/*` · `testing/script/*` · `git-integration/*` · `git-providers/*` · `ai/bruno-ai/*` · `ai/integration/*` · `apps/*` · `debugging/*` · `bru-cli/*` (+ `github-actions/*`) · `api-docs/*` · `html-docs/*` · `mock-servers/*` · `vs-code-extension/*` · `open-api/*` · `opencollection-yaml/*` · `converters/*` · `bru-lang/*` · `license-*/*`

Versioned copies live under `/v3/…` and `/v2/…`. Machine-readable index: `https://docs.usebruno.com/llms.txt`.
