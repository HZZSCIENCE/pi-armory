/**
 * Pi Armory — Session tree entry preview in Summarize branch dialog.
 *
 * Patches interactive-mode.js to show the selected entry's content
 * when navigating the session tree.
 */

import * as fs from "node:fs";
import * as path from "node:path";

const TARGET_REL = "dist/modes/interactive/interactive-mode.js";
const PATCH_MARKER = "/* PATCHED by pi-armory */";

const OLD_BLOCK = `const summaryChoice = await this.showExtensionSelector("Summarize branch?", [`;

const NEW_BLOCK = `                        // pi-armory: show selected entry content in summary dialog
                        ${PATCH_MARKER}
                        const selectedEntry = this.sessionManager.getEntry(entryId);
                        let entryPreview = "";
                        if (selectedEntry) {
                            if (selectedEntry.type === "message") {
                                const msg = selectedEntry.message;
                                const rawContent = typeof msg.content === "string"
                                    ? msg.content
                                    : Array.isArray(msg.content)
                                    ? msg.content.filter(c => c && c.type === 'text').map(c => c.text || '').join('')
                                    : '';
                                entryPreview = msg.role + ": " + rawContent;
                            } else {
                                entryPreview = selectedEntry.type + (selectedEntry.label ? ": " + selectedEntry.label : "");
                            }
                            entryPreview = entryPreview.replace(/[\\n\\t]/g, ' ').trim().slice(0, 80);
                        }
                        if (!entryPreview) entryPreview = selectedEntry ? selectedEntry.type : "entry";
                        const title = \`Summarize branch?\\n\\n\${entryPreview}\`;
                        const summaryChoice = await this.showExtensionSelector(title, [`;

/**
 * Tries to find the pi-coding-agent install directory.
 * Uses multiple approaches for robustness.
 */
function findTargetFile() {
  const candidates = [];

  // 1. Check npm global prefix
  const npmPrefix = (() => {
    try {
      // On Windows, npm global modules are typically in %APPDATA%/npm/node_modules
      const appData = process.env.APPDATA;
      if (appData) candidates.push(path.join(appData, "npm", "node_modules", "@mariozechner", "pi-coding-agent", TARGET_REL));
      const localAppData = process.env.LOCALAPPDATA;
      if (localAppData) candidates.push(path.join(localAppData, "npm", "node_modules", "@mariozechner", "pi-coding-agent", TARGET_REL));
      // Unix-like
      candidates.push(path.join(process.env.HOME || process.env.USERPROFILE || "/root", ".nvm", "versions", "node", "*", "lib", "node_modules", "@mariozechner", "pi-coding-agent", TARGET_REL));
      // Standard global
      candidates.push(path.join(path.sep, "usr", "local", "lib", "node_modules", "@mariozechner", "pi-coding-agent", TARGET_REL));
    } catch {}
  })();

  // 2. Try require.resolve (may fail in jiti but worth trying)
  try {
    const p = require.resolve("@mariozechner/pi-coding-agent/package.json");
    candidates.push(path.join(path.dirname(p), TARGET_REL));
  } catch {}

  // 3. Try walking from known paths
  try {
    if (typeof __dirname === "string") {
      // Walk up from extension directory to find node_modules/@mariozechner/pi-coding-agent
      let dir = __dirname;
      for (let i = 0; i < 10; i++) {
        const c = path.join(dir, "node_modules", "@mariozechner", "pi-coding-agent", TARGET_REL);
        if (fs.existsSync(c)) candidates.push(c);
        const parent = path.dirname(dir);
        if (parent === dir) break;
        dir = parent;
      }
    }
  } catch {}

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

function readFile(p) {
  try { return fs.readFileSync(p, "utf-8"); } catch { return null; }
}

function writeFile(p, content) {
  try { fs.writeFileSync(p, content, "utf-8"); return true; } catch { return false; }
}

function isPatched(p) {
  const c = readFile(p);
  return c ? c.includes(PATCH_MARKER) : false;
}

function applyPatch(p) {
  const c = readFile(p);
  if (!c) return { success: false, message: "Cannot read target file." };
  if (c.includes(PATCH_MARKER)) return { success: true, message: "Already patched." };
  if (!c.includes(OLD_BLOCK)) return { success: false, message: "Target code not found. Pi may have been updated — incompatible version." };

  const written = writeFile(p, c.replace(OLD_BLOCK, NEW_BLOCK));
  return written
    ? { success: true, message: "Patch applied. Restart pi to activate." }
    : { success: false, message: "Cannot write target file (permissions?)." };
}

function removePatch(p) {
  const c = readFile(p);
  if (!c) return { success: false, message: "Cannot read target file." };
  if (!c.includes(PATCH_MARKER)) return { success: true, message: "Not patched." };

  // Replace patched region (from "// pi-armory:" to "title, [" inclusive) with original
  const patchedRegion = /\/\/ pi-armory:.*?[\s\S]*?const summaryChoice = await this\.showExtensionSelector\(title, \[/;
  const restored = c.replace(patchedRegion, OLD_BLOCK);
  if (restored === c) return { success: false, message: "Could not find patched block." };

  return writeFile(p, restored)
    ? { success: true, message: "Patch removed. Restart pi to deactivate." }
    : { success: false, message: "Cannot write target file." };
}

/** @param {import("@mariozechner/pi-coding-agent").ExtensionAPI} pi */
export default function (pi) {
  const targetFile = findTargetFile();

  if (!targetFile) {
    pi.registerCommand("armory", {
      description: "Pi Armory — show entry preview in summarize dialog",
      handler: async (_args, ctx) => {
        ctx.ui.notify("Pi Armory ❌ not found", "error");
      },
    });
    return;
  }

  pi.registerCommand("armory", {
    description: "Pi Armory — show entry preview in summarize dialog",
    handler: async (args, ctx) => {
      const sub = (args || "").trim().toLowerCase();
      const notify = (msg, type) => ctx.ui.notify(msg, type || "info");

      if (sub === "on") {
        const r = applyPatch(targetFile);
        notify(r.success ? "⚡ PI ARMORY: ENGAGED [SYSTEM ACTIVE]" : `❌ ${r.message}`, r.success ? "success" : "error");
        return;
      }
      if (sub === "off") {
        const r = removePatch(targetFile);
        notify(r.success ? "🔻 PI ARMORY: DISENGAGED [GRID DOWN]" : `❌ ${r.message}`, "info");
        return;
      }

      // Toggle
      if (isPatched(targetFile)) {
        const r = removePatch(targetFile);
        notify(r.success ? "🔻 PI ARMORY: DISENGAGED [GRID DOWN]" : `❌ ${r.message}`, "info");
      } else {
        const r = applyPatch(targetFile);
        notify(r.success ? "⚡ PI ARMORY: ENGAGED [SYSTEM ACTIVE]" : `❌ ${r.message}`, r.success ? "success" : "error");
      }
    },
  });

  // Auto-enable on first install
  if (!isPatched(targetFile)) {
    applyPatch(targetFile);
    // Silent: feature activates after restart
  }
}
