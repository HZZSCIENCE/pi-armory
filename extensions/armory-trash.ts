/**
 * Pi Armory — Trash (Recycle Bin)
 *
 * Automatically saves backups before files are modified or deleted.
 * Hooks into write, edit, and bash (rm) operations.
 *
 * Features:
 * - Auto-backup before write/edit operations
 * - Bash rm interception with trash option
 * - /trash command to list and restore
 * - Default ON, toggle with /trash
 */

import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";

const TRASH_DIR = ".pi/trash";

function trashDir(): string {
  return path.join(process.cwd(), TRASH_DIR);
}

function ensureTrashDir(): void {
  const dir = trashDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function trashMetaPath(): string {
  return path.join(trashDir(), "trash.json");
}

interface TrashEntry {
  id: string;
  original: string;
  timestamp: string;
  size: number;
}

function loadMeta(): TrashEntry[] {
  try {
    return JSON.parse(fs.readFileSync(trashMetaPath(), "utf-8"));
  } catch {
    return [];
  }
}

function saveMeta(entries: TrashEntry[]): void {
  ensureTrashDir();
  fs.writeFileSync(trashMetaPath(), JSON.stringify(entries, null, 2), "utf-8");
}

function idFromPath(p: string): string {
  return crypto.createHash("md5").update(p + Date.now()).digest("hex").slice(0, 8);
}

function trashFile(id: string): string {
  return path.join(trashDir(), id);
}

function backupFile(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath);
    const id = idFromPath(filePath);
    fs.writeFileSync(trashFile(id), content);
    const entries = loadMeta();
    entries.push({
      id,
      original: path.resolve(filePath),
      timestamp: new Date().toISOString(),
      size: content.length,
    });
    saveMeta(entries);
    return id;
  } catch {
    return null;
  }
}

function restoreFile(id: string): boolean {
  const entries = loadMeta();
  const entry = entries.find(e => e.id === id);
  if (!entry) return false;
  try {
    const content = fs.readFileSync(trashFile(id));
    const dir = path.dirname(entry.original);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(entry.original, content);
    // Remove from meta and trash
    fs.unlinkSync(trashFile(id));
    saveMeta(entries.filter(e => e.id !== id));
    return true;
  } catch {
    return false;
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default function trashExtension(pi: ExtensionAPI): void {
  let enabled = true;

  ensureTrashDir();

  // Hook: backup before write
  pi.on("tool_call", async (event) => {
    if (!enabled) return;

    if (event.toolName === "write" || event.toolName === "edit") {
      const filePath = (event.input as any).path || (event.input as any).file_path;
      if (filePath) {
        const resolved = path.resolve(filePath);
        backupFile(resolved);
      }
    }

    if (event.toolName === "bash") {
      const cmd = String((event.input as any).command || "");
      // Detect rm commands and warn
      if (/\brm\b/.test(cmd) && !/\brm\s+-rf\s+\/home\/trash\b/.test(cmd)) {
        return {
          block: true,
          reason: `🗑  Trash: bash rm is blocked. Use /trash list to see saved files, or /trash off to disable.`,
        };
      }
    }
  });

  pi.registerCommand("trash", {
    description: "Pi Armory Trash — list, restore, or toggle recycle bin",
    handler: async (args, ctx) => {
      const sub = (args || "").trim().toLowerCase();

      if (sub === "off") {
        enabled = false;
        ctx.ui.notify("🔻 TRASH: DISENGAGED [DIRECT DELETE]", "info");
        return;
      }
      if (sub === "on") {
        enabled = true;
        ctx.ui.notify("⚡ TRASH: ENGAGED [RECYCLE BIN ACTIVE]", "info");
        return;
      }

      const entries = loadMeta();

      if (sub === "restore") {
        if (entries.length === 0) {
          ctx.ui.notify("Trash is empty.", "info");
          return;
        }
        const choice = await ctx.ui.select("Restore which file?", entries.map(e =>
          `${e.id}  ${path.basename(e.original)}  ${formatSize(e.size)}  ${e.timestamp.slice(0, 16)}`
        ));
        if (choice) {
          const id = choice.split(/\s+/)[0];
          const ok = restoreFile(id);
          ctx.ui.notify(ok ? `Restored: ${path.basename(entries.find(e => e.id === id)?.original || "")}` : "Restore failed.", ok ? "success" : "error");
        }
        return;
      }

      if (sub === "clear") {
        const files = fs.readdirSync(trashDir()).filter(f => f !== "trash.json");
        for (const f of files) fs.unlinkSync(path.join(trashDir(), f));
        saveMeta([]);
        ctx.ui.notify("🗑 Trash emptied.", "info");
        return;
      }

      // Default: list
      const status = enabled ? "⚡ ACTIVE" : "🔻 OFF";
      if (entries.length === 0) {
        ctx.ui.notify(`🗑 Trash ${status} — empty. /trash on | off | restore | clear`, "info");
      } else {
        const list = entries.map(e =>
          `  ${e.id}  ${path.basename(e.original)}  ${formatSize(e.size)}`
        ).join("\n");
        ctx.ui.notify(`🗑 Trash ${status} (${entries.length} files)\n${list}\n\n/trash restore | clear | on | off`, "info");
      }
    },
  });
}
