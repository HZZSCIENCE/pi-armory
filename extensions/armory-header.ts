/**
 * Pi Armory — Startup Header
 *
 * Replaces the verbose startup changelog with a compact Armory features banner.
 * Default: enabled. Toggle: /armory-header
 */

import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { Container, Spacer, Text } from "@mariozechner/pi-tui";

export default function (pi: ExtensionAPI): void {
  let enabled = true;

  function header(ctx: ExtensionContext) {
    const theme = ctx.ui.theme;
    const container = new Container();
    const D = theme.fg("success", "✅"); // default on

    container.addChild(new Spacer(1));
    container.addChild(new Text(theme.fg("accent", theme.bold("  🐱 Cat-Pi — Pi Armory")), 1, 0));
    container.addChild(new Text("  " + D + theme.fg("accent", " /armory") + theme.fg("muted", "  会话树预览 · Session Tree Preview"), 1, 0));
    container.addChild(new Text("  " + "  " + theme.fg("warning", " /plan") + theme.fg("muted", "    计划模式 · Plan Mode + PLAN.md"), 1, 0));
    container.addChild(new Text("  " + D + theme.fg("accent", " /trash") + theme.fg("muted", "  回收站 · Recycle Bin"), 1, 0));
    container.addChild(new Text("  " + "  " + theme.fg("dim", " /todos") + theme.fg("muted", "  计划进度 · Plan Progress"), 1, 0));
    container.addChild(new Text("  " + "  " + theme.fg("dim", "/armory-header") + theme.fg("muted", "  横幅开关 · Banner Toggle"), 1, 0));
    container.addChild(new Spacer(1));

    return container;
  }

  pi.on("session_start", (_event, ctx) => {
    if (!enabled || !ctx.hasUI) return;
    ctx.ui.setHeader((_tui, theme, _kb) => header(ctx));
  });

  pi.registerCommand("armory-header", {
    description: "Toggle Armory startup banner",
    handler: async (_args, ctx) => {
      enabled = !enabled;
      if (enabled) {
        ctx.ui.setHeader((_tui, theme, _kb) => header(ctx));
        ctx.ui.notify("⚡ ARMORY HEADER: ENGAGED", "info");
      } else {
        ctx.ui.setHeader(undefined);
        ctx.ui.notify("🔻 ARMORY HEADER: DISENGAGED", "info");
      }
    },
  });
}
