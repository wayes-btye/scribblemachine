# Claude × GitHub — MCP & Auto‑Approve Setup (Practical Guide)

This is a concise, copy‑pasteable reference for making Claude develop code for you **inside GitHub** with MCP tools (Supabase, Playwright, Context7, Shadcn), plus where to put files, how to wire secrets, and how to turn on **auto‑approve** in CI.

---

## 1) Quick definitions (no fluff)

- **CI (Continuous Integration)**: GitHub’s cloud machines (“runners”) executing your jobs when events happen (push/PR/schedule). Controlled by files in `.github/workflows/*.yml`.
- **Claude GitHub App**: The thing you installed. It reacts to comments/mentions and can create branches/PRs. No YAML required.
- **Claude Code GitHub Action**: A workflow step (`uses: anthropics/claude-code-action@v1`). This is where you pass flags, load MCPs, and control permissions.
- **MCP**: Model Context Protocol. Lets Claude call external tools (Supabase, Playwright, Context7, etc.). You declare these tools in a JSON file and point the Action at it.

---

## 2) Files to add / where they live

```
your-repo/
├─ .claude/
│  ├─ settings.json          # (optional) project-level permission defaults & tool allow/deny
├─ .mcp.json                 # MCP servers config (Supabase, Playwright, Context7, Shadcn)
├─ CLAUDE.md                 # (optional) short project instructions for Claude
├─ .github/
│  └─ workflows/
│     ├─ claude.yml          # already in your repo
│     └─ claude-code-review.yml  # already in your repo
```

> You **don’t** need to create a new workflow file. You can edit your two existing ones.

---

## 3) Secrets (where & what)

- **Where**: GitHub → **Repo** → Settings → **Secrets and variables** → **Actions** → *New repository secret*.
- **Add**:
  - `CLAUDE_CODE_OAUTH_TOKEN` *(you already have this from the App installer)* **OR** `ANTHROPIC_API_KEY` (API-key mode). Keep the existing OAuth token if it’s working.
  - MCP secrets your tools need, e.g. `SUPABASE_ACCESS_TOKEN`.
- **Use in workflow** via `env:`:

```yaml
env:
  SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

---

## 4) Make GitHub use your `.mcp.json`

Your MCP config file is **not** auto-loaded. In each workflow that runs Claude, pass this flag to the Action step:

```yaml
with:
  claude_args: >
    --mcp-config ./.mcp.json
```

Place `.mcp.json` in repo root (or anywhere) and point to it with the correct relative path.

### Sample `.mcp.json` (trimmed to your core tools)

```json
{
  "mcpServers": {
    "supabase": {
      "type": "stdio",
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@supabase/mcp-server-supabase@latest"],
      "env": { "SUPABASE_ACCESS_TOKEN": "${SUPABASE_ACCESS_TOKEN}" }
    },
    "playwright": {
      "type": "stdio",
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@playwright/mcp@0.0.39"]
    },
    "context7": {
      "type": "stdio",
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@upstash/context7-mcp@latest"]
    },
    "shadcn": {
      "type": "stdio",
      "command": "cmd",
      "args": ["/c", "npx", "-y", "shadcn@latest", "mcp"]
    }
  }
}
```

> Note: Expand envs for other MCPs as needed; avoid hardcoding secrets in JSON.

---

## 5) Auto‑approve in GitHub (CI) — **exactly where**

Add the permission mode to the **existing** Action step in both of your workflow files:

```yaml
with:
  # keep your existing inputs (e.g., claude_code_oauth_token)
  claude_args: >
    --mcp-config ./.mcp.json
    --permission-mode bypassPermissions
```

- `bypassPermissions` = no prompts, all tools auto‑approved in CI.
- Safer alternative: `acceptEdits` (auto‑approve file edits, but other tools may be restricted). Combine with allowlists (see §7).

> Do **not** put “auto-approve everything” text inside `CLAUDE.md`. That’s instructions, not a switch. The switch is the flag (above) or a setting in `.claude/settings.json`.

---

## 6) Playwright MCP on runners (one extra step)

Headless browsers aren’t preinstalled on GitHub’s runners. Add this step **before** the Claude action in any workflow that needs Playwright MCP:

```yaml
- name: Install Playwright browsers
  run: npx playwright install --with-deps
```

---

## 7) Optional repo-wide defaults (`.claude/settings.json`)

These defaults affect local + CI runs (unless overridden by flags). Start strict, loosen later:

```json
{
  "permissionMode": "acceptEdits",
  "allowedTools": [
    "Read", "Grep", "Glob", "Edit", "Write",
    "mcp__supabase__*",
    "mcp__playwright__*",
    "mcp__context7__*",
    "mcp__shadcn__*"
  ],
  "disallowedTools": [
    "Bash(rm -rf *)"
  ]
}
```

- In CI you can still override via `--permission-mode bypassPermissions` if you want full auto‑approve temporarily.

---

## 8) Where to edit *your* two existing workflows

Both `claude.yml` and `claude-code-review.yml` should have a step like this. **Add the **``** and **``** blocks** (and the Playwright install step if needed):

```yaml
- name: Run Claude
  uses: anthropics/claude-code-action@v1
  with:
    claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
    claude_args: >
      --mcp-config ./.mcp.json
      --permission-mode bypassPermissions
  env:
    SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

If triggers overlap across multiple workflows, both will run. That’s fine; if you want to avoid duplicate runs, constrain triggers (`branches`, `paths`) or add `concurrency:`.

---

## 9) Common struggles people hit (lessons learned)

From community experience and content creators:

1. **Hallucinations in workflow generation**: Claude can sometimes generate invalid YAML or assume integrations exist (e.g., Slack webhook vs. Slack App). Always validate and correct YAML manually.
2. **Tool permissions**: Automated jobs stall unless tools are auto‑approved. Always set `--permission-mode` or define allowlists in `.claude/settings.json`.
3. **MCP server reality check**: Even if Claude fetches an MCP online, you must test it manually. Some MCPs are incomplete (e.g., early Supabase MCPs lacked write support). Verify commands locally before trusting in CI.
4. **Supplying SDK docs**: When Claude doesn’t know how to use a new MCP or SDK, copy the relevant documentation into its context. This helps avoid stalls.
5. **Secrets**: MCPs (like Supabase) often need API keys. Ensure these are added as GitHub Secrets and passed in via `env:`. Missing secrets are a common cause of failure.

---

## 10) Minimal troubleshooting

- **“MCP didn’t load.”** Check the path in `--mcp-config`. Ensure the file is checked in. Confirm MCP server packages can be fetched (`npx` works on the runner).
- **“Playwright MCP failed.”** Add the browser install step (§6).
- **“It worked locally but not in GitHub.”** CI is a fresh VM. Ensure all secrets are present and referenced in `env:`. Add any missing tools to allowlist or use `bypassPermissions`.
- **“Multiple workflows firing.”** Adjust triggers or add `concurrency:`.

---

## 11) Copy‑paste checklist

-

---

### That’s the whole loop

- You keep working in GitHub (issues/PRs).
- Claude App responds to mentions.
- Workflows run on PR events, load MCPs from `.mcp.json`, and (if you choose) auto‑approve tool usage in CI via the flag.
- Be mindful of the common struggles above: test MCPs, auto‑approve tools, and provide docs when needed.

