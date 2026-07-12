import { defineAddon } from "@usenagi/core";

import type { Addon, DebugEvent } from "@usenagi/core";

type NormalizedError = {
  name?: string;
  message: string;
  stack?: string;
};

function normalizeError(cause: unknown): NormalizedError {
  if (cause instanceof Error) {
    return {
      name: cause.name,
      message: cause.message,
      stack: cause.stack,
    };
  }

  return {
    message: String(cause),
  };
}

function formatEvent(event: DebugEvent): string {
  const location = event.path ?? event.name;
  const uid = event.uid ? ` (${event.uid})` : "";
  const element = event.elementLabel ? ` <${event.elementLabel}>` : "";
  const head = `[nagi:debug] ${event.level}:${event.source}:${event.phase} ${location}${uid}${element}`;

  if (event.level === "info") {
    if (event.source === "scheduler" && event.cueLabel) {
      const cue =
        event.phase === "pending"
          ? ` waiting: ${event.cueLabel}`
          : ` cue: ${event.cueLabel}`;

      return `${head}${cue}`;
    }

    return head;
  }

  const error = normalizeError(event.cause);
  const causeMessage = [error.name, error.message].filter(Boolean).join(": ");

  return `${head}: ${causeMessage}`;
}

export function debugAddon(): Addon {
  return defineAddon({
    name: "@usenagi/debug",
    install(ctx) {
      ctx.addDebugReporter((event) => {
        if (event.level === "info") {
          console.info(formatEvent(event));
          return;
        }

        console.error(formatEvent(event), event.cause);
      });
    },
  });
}
