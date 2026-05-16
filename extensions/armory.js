/**
 * Pi Armory — Session tree entry preview in Summarize branch dialog.
 *
 * Patches interactive-mode.js to show the selected entry's content
 * when navigating the session tree.
 */

import * as fs from "node:fs";
import * as path from "node:path";

const AGENT_PKG = "@mariozechner/pi-coding-agent";
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

function findAgentDir() {
  try {
    const pkgJson = require.resolve(`${AGENT_PKG}/package.json`);
    return path.dirname(pkgJson);
  } catch {
    let dir = __dirname;
    for (let i = 0; i < 10; i++) {
      const candidate = path.join(dir, "node_modules", AGENT_PKG);
      if (fs.existsSync(candidate)) return candidate;
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
    return null;
  }
}

function isPatched(filePath) {
  try {
    return fs.readFileSync(filePath, "utf-8").includes(PATCH_MARKER);
  } catch {
    return false;
  }
}

function applyPatch(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  if (content.includes(PATCH_MARKER)) return { success: true, message: "Already patched." };
  if (!content.includes(OLD_BLOCK)) return { success: false, message: "Target code not found. Pi version may be incompatible." };

  fs.writeFileSync(filePath, content.replace(OLD_BLOCK, NEW_BLOCK), "utf-8");
  return { success: true, message: "Patch applied. Restart pi to activate." };
}

function removePatch(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  if (!content.includes(PATCH_MARKER)) return { success: true, message: "Not patched." };

  // Find lines from marker to the "const summaryChoice" line and replace
  const markerIdx = content.indexOf(PATCH_MARKER);
  const prefix = content.slice(0, Math.max(0, content.lastIndexOf("\n", markerIdx) - 5000));
  const afterMarker = content.slice(markerIdx);
  const summaryIdx = afterMarker.indexOf("const summaryChoice = await this.showExtensionSelector(title, [");
  if (summaryIdx < 0) return { success: false, message: "Could not find patched block." };

  const restored = prefix + OLD_BLOCK + afterMarker.slice(summaryIdx + "const summaryChoice = await this.showExtensionSelector(title, [".length);
  fs.writeFileSync(filePath, restored, "utf-8");
  return { success: true, message: "Patch removed. Restart pi to deactivate." };
}

/** @param {import("@mariozechner/pi-coding-agent").ExtensionAPI} pi */
export default function (pi) {
  const agentDir = findAgentDir();
  const targetFile = agentDir ? path.join(agentDir, TARGET_REL) : null;

  if (!targetFile || !fs.existsSync(targetFile)) {
    if (pi.log) pi.log.warn("pi-armory: could not locate pi-coding-agent installation.");
    return;
  }

  const patched = isPatched(targetFile);

  pi.registerCommand("armory", {
    description: "Pi Armory — show entry preview in summarize dialog",
    handler: async (args, ctx) => {
      const sub = (args || "").trim().toLowerCase();

      if (sub === "status") {
        ctx.ui.notify(`Pi Armory: ${isPatched(targetFile) ? "✅ Active" : "❌ Inactive"}`, "info");
        return;
      }

      if (sub === "install" || sub === "on") {
        const r = applyPatch(targetFile);
        ctx.ui.notify(`Pi Armory: ${r.message}`, r.success ? "success" : "error");
        return;
      }

      if (sub === "uninstall" || sub === "off") {
        const r = removePatch(targetFile);
        ctx.ui.notify(`Pi Armory: ${r.message}`, r.success ? "success" : "error");
        return;
      }

      const s = isPatched(targetFile);
      ctx.ui.notify(
        `Pi Armory ${s ? "✅ Active" : "❌ Inactive"}\n/armory install | uninstall | status`,
        "info"
      );
    },
  });

  if (patched) {
    pi.log?.info?.("Pi Armory ✅ active. /armory to manage.");
  } else {
    pi.log?.info?.("Pi Armory ❌ not active. Type /armory install to enable.");
  }
}
