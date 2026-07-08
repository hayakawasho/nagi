import { afterEach, describe, expect, it, vi } from "vitest";

import { create, useMount, useSlot } from "@usenagi/core";
import { debugAddon } from "@usenagi/core/addons/debug";

function makeEl(tagName = "div"): HTMLElement {
  const el = document.createElement(tagName);
  document.body.appendChild(el);
  return el;
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("debugAddon", () => {
  it("devmode reporter の console.error を1回だけ呼ぶ", async () => {
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("mount");
    const root = makeEl();
    const childEl = makeEl("button");
    childEl.id = "save";
    childEl.classList.add("primary");

    create()
      .install(debugAddon())
      .component({
        name: "Parent",
        setup: () => {
          useSlot().addChild(childEl, {
            name: "Child",
            setup: () => {
              useMount(() => {
                throw error;
              });
            },
          });
        },
      })(root);

    expect(errorLog).toHaveBeenCalledOnce();
    expect(errorLog).toHaveBeenCalledWith(
      expect.stringMatching(
        /^\[nagi:debug\] error:lifecycle:mount Parent > Child \(Child\.\d+\) <button#save\.primary>: Error: mount$/,
      ),
      error,
    );
  });

  it("Error 以外の cause でも message が破綻しない", async () => {
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    const cause = "mount failed";

    create()
      .install(debugAddon())
      .component({
        name: "App",
        setup: () => {
          useMount(() => {
            throw cause;
          });
        },
      })(makeEl());

    expect(errorLog).toHaveBeenCalledOnce();
    expect(errorLog).toHaveBeenCalledWith(
      expect.stringContaining(": mount failed"),
      cause,
    );
  });
});
