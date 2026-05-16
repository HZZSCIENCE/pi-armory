# Pi Armory

Two powerful extensions for Pi:

1. **Session Tree Entry Preview** — shows selected entry content in the "Summarize branch?" dialog
2. **Plan Mode (/plan)** — read-only exploration mode with safe code analysis, plan extraction, and progress tracking

---

## Install

```bash
pi install git:github.com/HZZSCIENCE/pi-armory
```

## Features

### Session Tree Preview (`/armory`)

When you navigate the session tree (Esc×2 or `/tree`), select a past entry, and press Enter — the dialog now shows the content of the selected entry so you know exactly what you're jumping to.

```
─────────────────────────────────
 Summarize branch?

 user: 帮我看下这个bug

 → No summary
   Summarize
   Summarize with custom prompt
─────────────────────────────────
```

| Command | Description |
|---------|-------------|
| `/armory` | Toggle on/off |
| `/armory on` | Force enable |
| `/armory off` | Force disable |

### Plan Mode (`/plan`)

Read-only exploration mode for safe code analysis. When enabled, only read-only tools are available.

| Command | Description |
|---------|-------------|
| `/plan` | Toggle plan mode |
| `/todos` | Show current plan progress |
| `Ctrl+Alt+P` | Toggle plan mode shortcut |

**How it works:**
1. `/plan` → enters read-only mode (only read, grep, find, ls, bash-safe allowed)
2. AI creates a numbered plan under a "Plan:" header
3. Choose "Execute the plan" → full tool access restored, progress tracked
4. AI marks completed steps with `[DONE:n]` tags
5. Progress widget shows ☐/☑ for each step

---

## Uninstall

```bash
/armory off
pi remove git:github.com/HZZSCIENCE/pi-armory
```
