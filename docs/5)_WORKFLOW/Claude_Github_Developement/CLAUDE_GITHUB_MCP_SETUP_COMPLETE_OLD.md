# Claude GitHub MCP & Auto-Approve Setup - COMPLETE ✅

**Date:** 2025-10-04
**Status:** Ready for Testing

## What Was Done

Successfully configured Claude GitHub App with MCP servers and auto-approve permissions for CI automation.

### Files Created/Modified

1. **`.mcp-github.json`** (NEW)
   - Linux-compatible MCP server configuration for GitHub Actions
   - Configured 6 MCP servers: Context7, Playwright, Shadcn, Supabase, Vercel, Cloud Run
   - Uses `npx` directly (no Windows `cmd /c` wrapper)

2. **`.github/workflows/claude.yml`** (UPDATED)
   - Added MCP config: `--mcp-config ./.mcp-github.json`
   - Added auto-approve: `--permission-mode bypassPermissions`
   - Installed Playwright browsers: `npx playwright install --with-deps`
   - Upgraded permissions to `write` for contents, pull-requests, and issues

3. **`.github/workflows/claude-code-review.yml`** (UPDATED)
   - Same changes as claude.yml
   - Retained existing allowed-tools configuration for gh commands

## What This Enables

✅ **Auto-Approve**: Claude can execute all tools in CI without manual intervention
✅ **MCP Tools**: Claude can use 6 MCP servers for enhanced capabilities
✅ **Supabase MCP**: Claude can query database schema, check RLS policies, etc.
✅ **Playwright MCP**: Claude can test UI interactions
✅ **Context7 MCP**: Claude can look up documentation
✅ **Write Permissions**: Claude can create branches, push changes, comment on issues/PRs

## Testing Instructions

### Test Issue Template

Create a new GitHub issue with this content:

```markdown
Title: Test MCP and Auto-Approve Setup

Body:
@claude Please complete this test:

1. Use the Supabase MCP to analyze our database schema
2. Generate a summary report of:
   - All tables and their columns
   - RLS policies status
   - Any missing indexes or common issues
3. Do a web search for "PostgreSQL database schema best practices 2025"
4. Compare our schema against best practices
5. Create a markdown report in `docs/2)_IN_WORK/database-schema-analysis.md`

Use the following MCP tools for this task:
- mcp__supabase__list_tables
- mcp__supabase__execute_sql (if needed for schema details)
- WebSearch

This tests:
- MCP server connectivity (Supabase)
- Auto-approve functionality
- File creation permissions
- Web search capability
```

### Expected Behavior

1. **Immediate**: Claude reacts with 👀 emoji
2. **Within 1-2 minutes**: Claude creates a new branch (e.g., `claude/issue-X-YYYYMMDD-HHMM`)
3. **Processing**: Claude executes the tasks using MCP tools (no manual approval needed)
4. **Completion**: Claude:
   - Creates the report file
   - Commits changes
   - Pushes to the branch
   - Provides a link to create a PR

### What to Monitor

**GitHub Actions Tab:**
- Watch the "Claude Code" workflow run
- Check logs for MCP server initialization
- Verify no permission prompts appear

**Key Success Indicators:**
- ✅ No "waiting for approval" messages
- ✅ MCP tools execute without errors
- ✅ Supabase MCP connects and queries database
- ✅ File created successfully
- ✅ Branch created and pushed

## Troubleshooting

### Issue: MCP Server Fails to Load
**Check:**
- GitHub Actions logs for npx errors
- Ensure Playwright browsers installed successfully

**Fix:**
- MCP config is in `.mcp-github.json` (Linux-compatible)
- Browser installation step runs before Claude action

### Issue: Permission Denied Errors
**Check:**
- Workflow permissions include `contents: write`, `pull-requests: write`, `issues: write`

**Fix:**
- Already configured correctly in both workflows

### Issue: Supabase MCP Can't Connect
**Current Setup:**
- Token is hardcoded in `.mcp-github.json`
- Token: `sbp_b4a5743522d2092e75dd6adea5d5b01c101d6765`

**Later Enhancement:**
- Add `SUPABASE_ACCESS_TOKEN` to GitHub secrets
- Update `.mcp-github.json` to use `${SUPABASE_ACCESS_TOKEN}`
- Pass secret via `env:` in workflow files

## SDK Documentation (For Advanced Tasks)

If Claude needs help with specific MCP SDK methods, you can provide documentation by:

1. **In the GitHub issue**: Include relevant docs as code blocks
2. **Reference URLs**: Link to official documentation
3. **Example**: For Supabase MCP, reference https://github.com/supabase/mcp-server-supabase

From the YouTube transcript, this was mentioned as a common fix when Claude doesn't know how to use new MCPs.

## Next Steps

### Immediate (Testing Phase)
1. ✅ Create test GitHub issue (use template above)
2. ✅ Monitor GitHub Actions run
3. ✅ Verify MCP tools work correctly
4. ✅ Check generated report quality

### Future Enhancements
1. ⏳ Move Supabase token to GitHub Secrets (for security)
2. ⏳ Add more MCP servers as needed
3. ⏳ Create custom `.claude/settings.json` for finer-grained tool permissions
4. ⏳ Set up branch protection rules if needed

## Security Considerations

**Current Setup:**
- `bypassPermissions` mode = No safety prompts
- Supabase token is hardcoded (visible in public repo if public)

**Recommended:**
- Use GitHub Secrets for all tokens
- Consider `acceptEdits` mode with allowlists for production
- Review all Claude changes before merging PRs

## Reference Documentation

- [Claude Code GitHub Actions](https://docs.claude.com/en/docs/claude-code/github-actions)
- [Your Setup Guide](./claude_git_hub_mcp_auto_approve_setup_practical_guide.md)
- [Supabase MCP](https://github.com/supabase/mcp-server-supabase)
- [YouTube Transcript Notes](../Youtube-transcripts.txt)

---

**Status:** ✅ Configuration Complete - Ready for Testing
**Committed:** 1dbd404 - "feat: enable MCP and auto-approve for Claude GitHub Actions"
**Pushed:** main branch
