import { defineAddon } from "@usenagi/core";

import type { Addon, DebugEvent } from "@usenagi/core";

function formatEvent(event: DebugEvent): string {
  const location = event.path ?? event.name;
  const uid = event.uid ? ` (${event.uid})` : "";
  const element = event.elementLabel ? ` <${event.elementLabel}>` : "";

  return `[nagi:debug] ${event.level}:${event.source}:${event.phase} ${location}${uid}${element}`;
}

export function debugAddon(): Addon {
  return defineAddon({
    name: "@usenagi/debug",
    install(ctx) {
      ctx.setDebugReporter((event) => {
        console.error(formatEvent(event), event.cause);
      });
    },
  });
}
