# GitHub Copilot Instructions for Battle Mode

## Issue Tracking with Dex

**CRITICAL**: This project uses **Dex** for ALL task tracking. Do NOT create
markdown TODO lists or alternate trackers.

### Essential Commands

```bash
npx -y @zeeg/dex list
npx -y @zeeg/dex list --all
npx -y @zeeg/dex create -d "Title" --context "Full context..."
npx -y @zeeg/dex create -d "Subtask" --context "Details" --parent <task-id>
npx -y @zeeg/dex complete <task-id> --result "What changed + verification"
```

### Key Rules

- Dex tasks live in `.dex/` and are committed
- No git hooks required
- Dex IDs are ephemeral; do not put them in commits or PRs
- Always use rich `--context` on create and rich `--result` on complete
- Do not create markdown TODO lists or alternate trackers

---

For detailed workflows and project-specific guidance, see
[AGENTS.md](../AGENTS.md).
