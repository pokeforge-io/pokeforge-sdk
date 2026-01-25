---
description: Review open GitHub issues and get suggestions on what to work on next.
---

## User Input

```text
$ARGUMENTS
```

You **MAY** use the user input to filter or focus the issue review (e.g., specific labels, milestones, or areas of the codebase).

## Instructions

### 1. Fetch Open Issues

Run the following command to get all open issues:

```bash
gh issue list --state open --limit 50 --json number,title,labels,assignees,createdAt,updatedAt,milestone,body
```

### 2. Analyze and Categorize

Review the issues and organize them by:

- **Priority** (based on labels like `priority:high`, `critical`, `bug`, etc.)
- **Type** (bug, feature, enhancement, documentation, etc.)
- **Complexity** (estimate based on title/description: small, medium, large)
- **Age** (how long the issue has been open)
- **Dependencies** (if any issues block or depend on others)

### 3. Present Summary

Display a concise summary:

```
## Open Issues Summary

**Total**: X open issues

### By Priority
- 🔴 Critical/High: X issues
- 🟡 Medium: X issues
- 🟢 Low: X issues

### By Type
- 🐛 Bugs: X
- ✨ Features: X
- 📝 Documentation: X
- 🔧 Maintenance: X
```

### 4. Make Recommendations

Suggest **3-5 issues** to work on next, considering:

1. **Quick wins** - Small issues that can be knocked out fast
2. **High impact** - Issues that provide significant value
3. **Blocking issues** - Issues that are blocking other work
4. **Stale issues** - Old issues that need attention or closure

For each recommendation, explain:
- Why this issue is a good next step
- Estimated effort (small/medium/large)
- Any prerequisites or related issues

### 5. Wait for User Choice

After presenting recommendations, ask:

> Which issue would you like to work on? (Enter issue number, or ask me to show more details about any issue)

### 6. When User Selects an Issue

Once the user picks an issue:

1. Fetch full issue details: `gh issue view <number> --json title,body,comments,labels`
2. Analyze what needs to be done
3. Create a plan or start implementation based on user preference
