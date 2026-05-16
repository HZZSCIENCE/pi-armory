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

    container.addChild(new Spacer(1));
    container.addChild(new Text(theme.fg("accent", theme.bold("  ⚡ PI ARMORY // SYS.ONLINE")), 1, 0));
    container.addChild(new Text("  " + theme.fg("success", " ▶") + theme.fg("accent", " /armory") + theme.fg("muted", "  会话树预览 · Tree Preview") + theme.fg("dim", "  [默认开启 · Default ON]"), 1, 0));
    container.addChild(new Text("  " + theme.fg("dim", " ▷") + theme.fg("warning", " /plan") + theme.fg("muted", "    计划模式 · Plan Mode"), 1, 0));
    container.addChild(new Text("  " + theme.fg("success", " ▶") + theme.fg("accent", " /trash") + theme.fg("muted", "  回收站 · Recycle Bin") + theme.fg("dim", "  [默认开启 · Default ON]"), 1, 0));
    container.addChild(new Text("  " + theme.fg("dim", " ▷") + theme.fg("dim", " /todos") + theme.fg("muted", "  计划进度 · Progress"), 1, 0));
    container.addChild(new Spacer(1));

    return container;
  }

  pi.on("session_start", (_event, ctx) => {
    if (!enabled || !ctx.hasUI) return;
    ctx.ui.setHeader((_tui, theme, _kb) => header(ctx));
  });

  pi.registerCommand("armory-header", {
    description: "Toggle startup banner",
    handler: async (_args, ctx) => {
      enabled = !enabled;
      if (enabled) {
        ctx.ui.setHeader((_tui, theme, _kb) => header(ctx));
        ctx.ui.notify("⚡ BANNER: ON", "info");
      } else {
        ctx.ui.setHeader(undefined);
        ctx.ui.notify("🔻 BANNER: OFF", "info");
      }
    },
  });
}
