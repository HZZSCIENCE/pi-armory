# Pi Armory

Enhances Pi's session tree with **entry preview** in the "Summarize branch?" dialog.

When you navigate the session tree (Esc×2 or `/tree`), select a past entry, and press Enter — the dialog now shows the content of the selected entry so you know exactly what you're jumping to.

## Install

```bash
pi install git:github.com/luoxuanbaogan/pi-armory
```

Then activate:

```
/armory install
```

Restart pi.

## Usage

1. Open session tree: `Esc×2` or `/tree`
2. Select any past entry, press `Enter`
3. You'll see:

```
─────────────────────────────────
 Summarize branch?

 user: 帮我看下这个bug          ← shows selected entry content

 → No summary
   Summarize
   Summarize with custom prompt
─────────────────────────────────
```

## Commands

| Command | Description |
|---------|-------------|
| `/armory` | Show status |
| `/armory install` | Apply patch |
| `/armory uninstall` | Remove patch |
| `/armory status` | Check if active |

## Uninstall

```
/armory uninstall
pi remove git:github.com/luoxuanbaogan/pi-armory
```
